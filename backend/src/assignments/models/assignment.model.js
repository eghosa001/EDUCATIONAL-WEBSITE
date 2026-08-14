import { query } from '../../common/database/index.js';

export const assignmentModel = {
  async findById(id) {
    const result = await query('SELECT * FROM assignments WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      courseId, lessonId, teacherId, title, description, instructions,
      assignmentType, maxScore, dueDate, allowLateSubmission, latePenaltyPercent,
      maxFileSizeMb, allowedFileTypes,
    } = data;
    const result = await query(
      `INSERT INTO assignments (
         course_id, lesson_id, teacher_id, title, description, instructions,
         assignment_type, max_score, due_date, allow_late_submission,
         late_penalty_percent, max_file_size_mb, allowed_file_types
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        courseId, lessonId, teacherId, title, description, instructions,
        assignmentType, maxScore, dueDate, allowLateSubmission,
        latePenaltyPercent, maxFileSizeMb, allowedFileTypes,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE assignments SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         instructions = COALESCE($4, instructions),
         max_score = COALESCE($5, max_score),
         due_date = COALESCE($6, due_date),
         allow_late_submission = COALESCE($7, allow_late_submission),
         late_penalty_percent = COALESCE($8, late_penalty_percent),
         max_file_size_mb = COALESCE($9, max_file_size_mb),
         allowed_file_types = COALESCE($10, allowed_file_types),
         is_active = COALESCE($11, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.title, data.description, data.instructions, data.maxScore, data.dueDate, data.allowLateSubmission, data.latePenaltyPercent, data.maxFileSizeMb, data.allowedFileTypes, data.isActive]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, courseId, teacherId, isActive } = {}) {
    const conditions = [];
    const values = [];

    if (courseId) {
      conditions.push(`course_id = $${values.length + 1}`);
      values.push(courseId);
    }
    if (teacherId) {
      conditions.push(`teacher_id = $${values.length + 1}`);
      values.push(teacherId);
    }
    if (isActive !== undefined) {
      conditions.push(`is_active = $${values.length + 1}`);
      values.push(isActive);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM assignments ${whereClause} ORDER BY due_date DESC NULLS LAST LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM assignments WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default assignmentModel;
