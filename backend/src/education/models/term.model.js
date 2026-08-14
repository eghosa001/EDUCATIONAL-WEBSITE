import { query } from '../../common/database/index.js';

export const termModel = {
  async findById(id) {
    const result = await query('SELECT * FROM terms WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { educationSystemId, name, code, description, orderIndex } = data;
    const result = await query(
      `INSERT INTO terms (education_system_id, name, code, description, order_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [educationSystemId, name, code, description, orderIndex]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE terms SET
         name = COALESCE($2, name),
         code = COALESCE($3, code),
         description = COALESCE($4, description),
         order_index = COALESCE($5, order_index),
         is_active = COALESCE($6, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.name, data.code, data.description, data.orderIndex, data.isActive]
    );
    return result.rows[0] || null;
  },

  async listBySystem(educationSystemId) {
    const result = await query(
      'SELECT * FROM terms WHERE education_system_id = $1 ORDER BY order_index',
      [educationSystemId]
    );
    return result.rows;
  },

  async delete(id) {
    const result = await query('DELETE FROM terms WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default termModel;
