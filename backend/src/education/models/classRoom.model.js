import { query } from '../../common/database/index.js';

export const classRoomModel = {
  async findById(id) {
    const result = await query('SELECT * FROM classes WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { programId, name, code, description, orderIndex } = data;
    const result = await query(
      `INSERT INTO classes (program_id, name, code, description, order_index)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [programId, name, code, description, orderIndex]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE classes SET
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

  async listByProgram(programId) {
    const result = await query(
      'SELECT * FROM classes WHERE program_id = $1 ORDER BY order_index',
      [programId]
    );
    return result.rows;
  },

  async list({ page = 1, limit = 20, programId } = {}) {
    const values = [];
    let whereClause = '';
    if (programId) {
      values.push(programId);
      whereClause = 'WHERE program_id = $1';
    }
    const offset = (page - 1) * limit;
    values.push(limit, offset);
    const result = await query(
      `SELECT * FROM classes ${whereClause} ORDER BY order_index LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM classes WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default classRoomModel;
