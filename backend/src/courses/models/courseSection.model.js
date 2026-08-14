import { query } from '../../common/database/index.js';

export const courseSectionModel = {
  async findById(id) {
    const result = await query('SELECT * FROM course_sections WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const { courseId, title, description, orderIndex } = data;
    const result = await query(
      `INSERT INTO course_sections (course_id, title, description, order_index)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [courseId, title, description, orderIndex]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE course_sections SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         order_index = COALESCE($4, order_index),
         is_active = COALESCE($5, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.title, data.description, data.orderIndex, data.isActive]
    );
    return result.rows[0] || null;
  },

  async listByCourse(courseId) {
    const result = await query(
      'SELECT * FROM course_sections WHERE course_id = $1 AND is_active ORDER BY order_index',
      [courseId]
    );
    return result.rows;
  },

  async delete(id) {
    const result = await query('DELETE FROM course_sections WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default courseSectionModel;
