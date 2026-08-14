import { query } from '../../common/database/index.js';

export const pointsHistoryModel = {
  async create(data) {
    const result = await query(
      `INSERT INTO points_history (user_id, action, points, description, metadata)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.userId, data.action, data.points, data.description || null, data.metadata || '{}']
    );
    return result.rows[0];
  },

  async listByUser(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM points_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const countResult = await query('SELECT COUNT(*)::int AS total FROM points_history WHERE user_id = $1', [userId]);
    return { data: result.rows, pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) } };
  },
};

export default pointsHistoryModel;