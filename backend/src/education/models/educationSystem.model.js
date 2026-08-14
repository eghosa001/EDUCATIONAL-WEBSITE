import { query } from '../../common/database/index.js';

export const educationSystemModel = {
  async findById(id) {
    const result = await query('SELECT * FROM education_systems WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByCode(code) {
    const result = await query('SELECT * FROM education_systems WHERE code = $1', [code]);
    return result.rows[0] || null;
  },

  async create({ name, code, country, description }) {
    const result = await query(
      `INSERT INTO education_systems (name, code, country, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, code, country, description]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE education_systems SET
         name = COALESCE($2, name),
         code = COALESCE($3, code),
         country = COALESCE($4, country),
         description = COALESCE($5, description),
         is_active = COALESCE($6, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.name, data.code, data.country, data.description, data.isActive]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM education_systems ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM education_systems WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default educationSystemModel;
