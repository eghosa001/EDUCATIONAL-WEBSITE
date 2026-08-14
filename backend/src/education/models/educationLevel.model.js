import { query } from '../../common/database/index.js';

export const educationLevelModel = {
  async findById(id) {
    const result = await query('SELECT * FROM education_levels WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { educationSystemId, name, code, description, orderIndex, minAge, maxAge } = data;
    const result = await query(
      `INSERT INTO education_levels (education_system_id, name, code, description, order_index, min_age, max_age)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [educationSystemId, name, code, description, orderIndex, minAge, maxAge]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE education_levels SET
         name = COALESCE($2, name),
         code = COALESCE($3, code),
         description = COALESCE($4, description),
         order_index = COALESCE($5, order_index),
         min_age = COALESCE($6, min_age),
         max_age = COALESCE($7, max_age),
         is_active = COALESCE($8, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.name, data.code, data.description, data.orderIndex, data.minAge, data.maxAge, data.isActive]
    );
    return result.rows[0] || null;
  },

  async listBySystem(educationSystemId) {
    const result = await query(
      'SELECT * FROM education_levels WHERE education_system_id = $1 ORDER BY order_index',
      [educationSystemId]
    );
    return result.rows;
  },

  async list({ page = 1, limit = 20, educationSystemId } = {}) {
    const values = [];
    let whereClause = '';
    if (educationSystemId) {
      values.push(educationSystemId);
      whereClause = 'WHERE education_system_id = $1';
    }
    const offset = (page - 1) * limit;
    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM education_levels ${whereClause} ORDER BY order_index LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM education_levels WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default educationLevelModel;
