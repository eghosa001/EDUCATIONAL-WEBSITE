import { query, getClient, transaction } from '../common/database/index.js';
import { AppError } from '../common/errors/index.js';
import { HTTP_STATUS } from '../common/constants/index.js';

const MODERATION_STATUSES = ['pending', 'approved', 'rejected', 'flagged'];

export const moderationService = {
  async getQueue(params = {}) {
    const { page = 1, limit = 20, type, status = 'pending' } = params;
    const offset = (page - 1) * limit;

    const conditions = ['status = $1'];
    const values = [status];
    let paramIndex = 2;

    if (type) {
      conditions.push(`content_type = $${paramIndex++}`);
      values.push(type);
    }

    const whereClause = conditions.join(' AND ');

    const result = await query(
      `SELECT mq.*, u.first_name, u.last_name, u.email as reporter_email,
              c.title as content_title, c.content_type
       FROM moderation_queue mq
       JOIN users u ON mq.reported_by = u.id
       LEFT JOIN ${this.getContentTable(mq.contentType)} c ON mq.content_id = c.id
       WHERE ${whereClause}
       ORDER BY mq.created_at ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM moderation_queue WHERE ${whereClause}`,
      values
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },

  async review(moderationId, moderatorId, action, notes = '') {
    const moderation = await query('SELECT * FROM moderation_queue WHERE id = $1', [moderationId]);
    if (!moderation.rows[0]) throw new AppError('Moderation item not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');

    const result = await query(
      `UPDATE moderation_queue
       SET status = $2, reviewed_by = $3, reviewed_at = NOW(), notes = $4
       WHERE id = $1
       RETURNING *`,
      [moderationId, action, moderatorId, notes]
    );

    const reviewed = result.rows[0];

    if (action === 'rejected' || action === 'flagged') {
      await this.applyAction(reviewed.contentType, reviewed.contentId, action);
    }

    return reviewed;
  },

  async flagContent(data) {
    const { contentType, contentId, reportedBy, reason, description } = data;

    const exists = await query(
      'SELECT id FROM moderation_queue WHERE content_type = $1 AND content_id = $2 AND status = $3',
      [contentType, contentId, 'pending']
    );

    if (exists.rows[0]) {
      await query(
        `UPDATE moderation_queue SET flag_count = flag_count + 1, last_flagged_at = NOW() WHERE id = $1`,
        [exists.rows[0].id]
      );
      return exists.rows[0];
    }

    const result = await query(
      `INSERT INTO moderation_queue (content_type, content_id, reported_by, reason, description, status, flag_count)
       VALUES ($1, $2, $3, $4, $5, 'pending', 1)
       RETURNING *`,
      [contentType, contentId, reportedBy, reason, description]
    );
    return result.rows[0];
  },

  async autoModerate(content, rules = {}) {
    const issues = [];

    if (rules.blockedWords && content) {
      const contentText = typeof content === 'string' ? content : JSON.stringify(content);
      for (const word of rules.blockedWords) {
        if (contentText.toLowerCase().includes(word.toLowerCase())) {
          issues.push({ type: 'blocked_word', word });
        }
      }
    }

    if (rules.maxLength && content) {
      const contentText = typeof content === 'string' ? content : JSON.stringify(content);
      if (contentText.length > rules.maxLength) {
        issues.push({ type: 'exceeds_max_length', maxLength: rules.maxLength });
      }
    }

    if (issues.length > 0) {
      return { isFlagged: true, issues };
    }

    return { isFlagged: false, issues: [] };
  },

  async getContentStats() {
    const result = await query(`
      SELECT
        content_type,
        status,
        COUNT(*)::int as count
      FROM moderation_queue
      GROUP BY content_type, status
      ORDER BY content_type, status
    `);
    return result.rows;
  },

  async getPendingCount() {
    const result = await query(`SELECT COUNT(*)::int as count FROM moderation_queue WHERE status = 'pending'`);
    return result.rows[0]?.count || 0;
  },

  async approveContent(moderationId) {
    const result = await query(
      `UPDATE moderation_queue SET status = 'approved', reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [moderationId]
    );
    return result.rows[0];
  },

  async deleteFlaggedContent(moderationId) {
    const moderation = await query('SELECT * FROM moderation_queue WHERE id = $1', [moderationId]);
    if (!moderation.rows[0]) throw new AppError('Item not found', HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');

    await this.applyAction(moderation.rows[0].contentType, moderation.rows[0].contentId, 'deleted');
    await query('DELETE FROM moderation_queue WHERE id = $1', [moderationId]);
  },

  async applyAction(contentType, contentId, action) {
    const deleteFuncs = {
      post: () => query('DELETE FROM posts WHERE id = $1', [contentId]),
      comment: () => query('DELETE FROM comments WHERE id = $1', [contentId]),
      forum: () => query('DELETE FROM forums WHERE id = $1', [contentId]),
      study_group: () => query('DELETE FROM study_groups WHERE id = $1', [contentId]),
    };

    if (deleteFuncs[contentType]) {
      await deleteFuncs[contentType]();
    }
  },

  getContentTable(contentType) {
    const tableMap = {
      post: 'posts',
      comment: 'comments',
      forum: 'forums',
      study_group: 'study_groups',
    };
    return tableMap[contentType] || contentType + 's';
  },
};

export default moderationService;
