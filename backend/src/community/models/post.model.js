import { query } from '../../common/database/index.js';

export const postModel = {
  async listByForum(forumId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT p.*, u.first_name, u.last_name, u.avatar_url
       FROM community_posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.forum_id = $1 AND p.status = 'published'
       ORDER BY p.is_pinned DESC, p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [forumId, limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM community_posts WHERE forum_id = $1 AND status = \'published\'', [forumId]);
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },

  async findById(id) {
    const result = await query(
      `SELECT p.*, u.first_name, u.last_name, u.avatar_url
       FROM community_posts p
       JOIN users u ON u.id = p.user_id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const result = await query(
      `INSERT INTO community_posts (user_id, title, content, forum_id, subject_id, topic_id, course_id, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.userId, data.title, data.content, data.forumId || null, data.subjectId || null, data.topicId || null, data.courseId || null, data.tags || []]
    );
    return result.rows[0];
  },

  async update(id, userId, data) {
    const result = await query(
      `UPDATE community_posts SET
         title = COALESCE($3, title),
         content = COALESCE($4, content),
         tags = COALESCE($5, tags),
         updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, data.title, data.content, data.tags]
    );
    return result.rows[0] || null;
  },

  async delete(id, userId) {
    const result = await query('DELETE FROM community_posts WHERE id = $1 AND user_id = $2 RETURNING *', [id, userId]);
    return result.rows[0] || null;
  },

  async incrementViews(id) {
    await query('UPDATE community_posts SET views = views + 1 WHERE id = $1', [id]);
  },

  async incrementLikeCount(id, delta) {
    await query('UPDATE community_posts SET likes_count = GREATEST(0, likes_count + $2) WHERE id = $1', [id, delta]);
  },

  async incrementReplyCount(id, delta) {
    await query('UPDATE community_posts SET replies_count = GREATEST(0, replies_count + $2) WHERE id = $1', [id, delta]);
  },

  async updateLastReplyAt(id) {
    await query('UPDATE community_posts SET last_reply_at = NOW() WHERE id = $1', [id]);
  },
};

export default postModel;