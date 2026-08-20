import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';

export const corporateTrainingModel = {
  async findById(id) {
    const result = await query(
      `SELECT ct.*, o.name AS organization_name, o.logo_url AS organization_logo,
              u.first_name AS creator_name, u.email AS creator_email
       FROM corporate_trainings ct
       LEFT JOIN organizations o ON ct.organization_id = o.id
       JOIN users u ON ct.created_by = u.id
       WHERE ct.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async list(params) {
    const { page = 1, limit = 20, organizationId, status, search, sortBy = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;
    const allowedSorts = ['title', 'created_at', 'enrolled_count', 'price'];
    const safeSort = allowedSorts.includes(sortBy) ? sortBy : 'created_at';
    const safeOrder = order === 'asc' ? 'ASC' : 'DESC';

    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (organizationId) {
      whereClauses.push(`ct.organization_id = $${paramIndex}`);
      values.push(organizationId);
      paramIndex++;
    }
    if (status) {
      whereClauses.push(`ct.status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }
    if (search) {
      whereClauses.push(`(ct.title ILIKE $${paramIndex} OR ct.description ILIKE $${paramIndex})`);
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(
      `SELECT ct.*, o.name AS organization_name, o.logo_url AS organization_logo
       FROM corporate_trainings ct
       LEFT JOIN organizations o ON ct.organization_id = o.id
       ${whereSql}
       ORDER BY ct.${safeSort} ${safeOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM corporate_trainings ct ${whereSql}`,
      values
    );

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / parseInt(limit)),
      },
    };
  },

  async create(data) {
    const {
      organizationId, createdBy, title, slug, description, curriculum,
      price, currency, isFree, durationDays, maxParticipants, status,
    } = data;
    const result = await query(
      `INSERT INTO corporate_trainings (
        organization_id, created_by, title, slug, description, curriculum,
        price, currency, is_free, duration_days, max_participants, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [organizationId, createdBy, title, slug, description, curriculum, price, currency, isFree, durationDays, maxParticipants, status]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const updatableFields = ['title', 'slug', 'description', 'curriculum', 'price', 'currency',
      'is_free', 'duration_days', 'max_participants', 'status'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${paramIndex}`);
        values.push(data[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) return null;
    values.push(id);

    const result = await query(
      `UPDATE corporate_trainings SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(id) {
    const result = await query('DELETE FROM corporate_trainings WHERE id = $1 RETURNING id', [id]);
    return result.rows[0];
  },

  // Team/Bulk enrollment
  async bulkEnroll(data) {
    const { trainingId, userIds, enrolledBy } = data;
    const results = [];
    for (const userId of userIds) {
      const existing = await query(
        'SELECT id FROM corporate_training_enrollments WHERE training_id = $1 AND user_id = $2',
        [trainingId, userId]
      );
      if (!existing.rows[0]) {
        const result = await query(
          `INSERT INTO corporate_training_enrollments (training_id, user_id, enrolled_by, status)
           VALUES ($1, $2, $3, 'active') RETURNING *`,
          [trainingId, userId, enrolledBy]
        );
        results.push(result.rows[0]);
      }
    }
    return results;
  },

  async enrollUser(trainingId, userId, enrolledBy) {
    const existing = await query(
      'SELECT id FROM corporate_training_enrollments WHERE training_id = $1 AND user_id = $2',
      [trainingId, userId]
    );
    if (existing.rows[0]) {
      return existing.rows[0];
    }
    const result = await query(
      `INSERT INTO corporate_training_enrollments (training_id, user_id, enrolled_by, status)
       VALUES ($1, $2, $3, 'active') RETURNING *`,
      [trainingId, userId, enrolledBy]
    );
    return result.rows[0];
  },

  async listEnrollments(params) {
    const { page = 1, limit = 20, trainingId, organizationId, status } = params;
    const offset = (page - 1) * limit;
    let whereClauses = [];
    let values = [];
    let paramIndex = 1;

    if (trainingId) { whereClauses.push(`cte.training_id = $${paramIndex}`); values.push(trainingId); paramIndex++; }
    if (organizationId) { whereClauses.push(`cte.organization_id = $${paramIndex}`); values.push(organizationId); paramIndex++; }
    if (status) { whereClauses.push(`cte.status = $${paramIndex}`); values.push(status); paramIndex++; }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const result = await query(
      `SELECT cte.*, u.first_name, u.last_name, u.email, u.phone, u.avatar_url
       FROM corporate_training_enrollments cte
       JOIN users u ON cte.user_id = u.id
       ${whereSql}
       ORDER BY cte.enrolled_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...values, limit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*) as total FROM corporate_training_enrollments cte ${whereSql}`,
      values
    );

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0]?.total || 0),
        totalPages: Math.ceil(parseInt(countResult.rows[0]?.total || 0) / parseInt(limit)),
      },
    };
  },

  async getTrainingStats(trainingId) {
    const result = await query(
      `SELECT COUNT(*) as total_enrolled,
              SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_enrolled,
              SUM(CASE WHEN completion_percentage >= 100 THEN 1 ELSE 0 END) as completed
       FROM corporate_training_enrollments WHERE training_id = $1`,
      [trainingId]
    );
    return result.rows[0];
  },
};
