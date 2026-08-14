import { query } from '../../common/database/index.js';

export const programModel = {
  async findById(id) {
    const result = await query('SELECT * FROM programs WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { educationLevelId, name, code, description, durationYears, orderIndex } = data;
    const result = await query(
      `INSERT INTO programs (education_level_id, name, code, description, duration_years, order_index)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [educationLevelId, name, code, description, durationYears, orderIndex]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE programs SET
         name = COALESCE($2, name),
         code = COALESCE($3, code),
         description = COALESCE($4, description),
         duration_years = COALESCE($5, duration_years),
         order_index = COALESCE($6, order_index),
         is_active = COALESCE($7, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.name, data.code, data.description, data.durationYears, data.orderIndex, data.isActive]
    );
    return result.rows[0] || null;
  },

  async listByLevel(educationLevelId) {
    const result = await query(
      'SELECT * FROM programs WHERE education_level_id = $1 ORDER BY order_index',
      [educationLevelId]
    );
    return result.rows;
  },

  async list({ page = 1, limit = 20, educationLevelId } = {}) {
    const values = [];
    let whereClause = '';
    if (educationLevelId) {
      values.push(educationLevelId);
      whereClause = 'WHERE education_level_id = $1';
    }
    const offset = (page - 1) * limit;
    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM programs ${whereClause} ORDER BY order_index LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM programs WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default programModel;
