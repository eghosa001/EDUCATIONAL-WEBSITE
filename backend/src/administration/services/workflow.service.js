import { query, getClient, transaction } from '../../common/database/index.js';
import { AppError } from '../../common/errors/index.js';
import { HTTP_STATUS } from '../../common/constants/index.js';

const WORKFLOW_STATUSES = ['draft', 'review', 'approved', 'published', 'archived', 'rejected'];
const CONTENT_TYPES = ['course', 'lesson', 'question', 'exam', 'flashcard', 'library_resource'];

export const workflowModel = {
  async findById(id) {
    const result = await query('SELECT * FROM content_workflows WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByContent(contentType, contentId) {
    const result = await query(
      'SELECT * FROM content_workflows WHERE content_type = $1 AND content_id = $2 ORDER BY created_at DESC LIMIT 1',
      [contentType, contentId]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const { contentType, contentId, createdBy, title, description } = data;
    const result = await query(
      `INSERT INTO content_workflows (content_type, content_id, status, title, description, created_by)
       VALUES ($1, $2, 'draft', $3, $4, $5)
       RETURNING *`,
      [contentType, contentId, title, description, createdBy]
    );
    return result.rows[0];
  },

  async updateStatus(id, status, updatedBy) {
    const result = await query(
      `UPDATE content_workflows
       SET status = $2, updated_by = $3, updated_at = NOW()
       WHERE id = $1 AND status != 'published' AND status != 'archived'
       RETURNING *`,
      [id, status, updatedBy]
    );
    return result.rows[0] || null;
  },

  async addReview(id, reviewerId, reviewData) {
    const result = await query(
      `INSERT INTO content_reviews (workflow_id, reviewer_id, rating, comments, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, reviewerId, reviewData.rating, reviewData.comments, reviewData.status]
    );
    return result.rows[0];
  },

  async getPendingReviews() {
    const result = await query(
      `SELECT cw.*, u.first_name, u.last_name, u.email as reviewer_email
       FROM content_workflows cw
       JOIN users u ON cw.updated_by = u.id
       WHERE cw.status = 'review'
       ORDER BY cw.created_at ASC`
    );
    return result.rows;
  },

  async getWorkflowsByUser(userId, params = {}) {
    const { page = 1, limit = 20, status } = params;
    const conditions = ['created_by = $1'];
    const values = [userId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    const whereClause = conditions.join(' AND ');
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM content_workflows ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM content_workflows ${whereClause}`,
      values.slice(0, paramIndex - 2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },

  async getAdminWorkflows(params = {}) {
    const { page = 1, limit = 20, status, contentType } = params;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (contentType) {
      conditions.push(`content_type = $${paramIndex++}`);
      values.push(contentType);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT cw.*, u.first_name, u.last_name
       FROM content_workflows cw
       JOIN users u ON cw.created_by = u.id
       ${whereClause}
       ORDER BY cw.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      values
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM content_workflows ${whereClause}`,
      values.slice(0, paramIndex - 2)
    );

    return {
      data: result.rows,
      pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit) }
    };
  },
};

export const contentApprovalService = {
  async submitForReview(contentType, contentId, userId, data = {}) {
    let workflow = await workflowModel.findByContent(contentType, contentId);

    if (!workflow) {
      workflow = await workflowModel.create({
        contentType,
        contentId,
        createdBy: userId,
        title: data.title,
        description: data.description,
      });
    }

    if (workflow.status === 'published' || workflow.status === 'archived') {
      throw new AppError('Cannot submit published or archived content', HTTP_STATUS.BAD_REQUEST, 'INVALID_STATUS');
    }

    workflow = await workflowModel.updateStatus(workflow.id, 'review', userId);
    return workflow;
  },

  async reviewContent(workflowId, reviewerId, data) {
    const workflow = await workflowModel.findById(workflowId);
    if (!workflow) throw new AppError('Workflow not found', HTTP_STATUS.NOT_FOUND, 'WORKFLOW_NOT_FOUND');

    if (workflow.status !== 'review') {
      throw new AppError('Workflow is not in review status', HTTP_STATUS.BAD_REQUEST, 'INVALID_STATUS');
    }

    const review = await workflowModel.addReview(workflowId, reviewerId, data);

    if (data.status === 'approved') {
      await workflowModel.updateStatus(workflowId, 'approved', reviewerId);
      return { workflow: await workflowModel.findById(workflowId), review };
    } else if (data.status === 'rejected') {
      await workflowModel.updateStatus(workflowId, 'draft', reviewerId);
      return { workflow: await workflowModel.findById(workflowId), review };
    }

    return { workflow, review };
  },

  async publishContent(workflowId, adminId) {
    const workflow = await workflowModel.findById(workflowId);
    if (!workflow) throw new AppError('Workflow not found', HTTP_STATUS.NOT_FOUND, 'WORKFLOW_NOT_FOUND');

    if (workflow.status !== 'approved') {
      throw new AppError('Content must be approved before publishing', HTTP_STATUS.BAD_REQUEST, 'INVALID_STATUS');
    }

    const result = await workflowModel.updateStatus(workflowId, 'published', adminId);

    if (result) {
      await query(
        `UPDATE ${workflow.contentType}s SET is_published = true WHERE id = $1`,
        [workflow.contentId]
      );
    }

    return result;
  },

  async getReviewStats() {
    const result = await query(`
      SELECT
        status,
        COUNT(*)::int as count,
        COUNT(DISTINCT content_type) as content_types
      FROM content_workflows
      GROUP BY status
      ORDER BY created_at DESC
    `);
    return result.rows;
  },

  async getPendingCount() {
    const result = await query(`
      SELECT COUNT(*)::int as count
      FROM content_workflows
      WHERE status = 'review'
    `);
    return result.rows[0]?.count || 0;
  },
};

export default contentApprovalService;
