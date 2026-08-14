import { query } from '../../common/database/index.js';

export const quizModel = {
  async findById(id) {
    const result = await query('SELECT * FROM quizzes WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      courseId, lessonId, title, description, instructions, timeLimitMinutes,
      passingScore, maxAttempts, shuffleQuestions, showExplanation,
    } = data;
    const result = await query(
      `INSERT INTO quizzes (course_id, lesson_id, title, description, instructions, time_limit_minutes, passing_score, max_attempts, shuffle_questions, show_explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [courseId, lessonId, title, description, instructions, timeLimitMinutes, passingScore, maxAttempts, shuffleQuestions, showExplanation]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE quizzes SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         instructions = COALESCE($4, instructions),
         time_limit_minutes = COALESCE($5, time_limit_minutes),
         passing_score = COALESCE($6, passing_score),
         max_attempts = COALESCE($7, max_attempts),
         shuffle_questions = COALESCE($8, shuffle_questions),
         show_explanation = COALESCE($9, show_explanation),
         is_active = COALESCE($10, is_active)
       WHERE id = $1
       RETURNING *`,
      [id, data.title, data.description, data.instructions, data.timeLimitMinutes, data.passingScore, data.maxAttempts, data.shuffleQuestions, data.showExplanation, data.isActive]
    );
    return result.rows[0] || null;
  },

  async listByCourse(courseId) {
    const result = await query(
      'SELECT * FROM quizzes WHERE course_id = $1 AND is_active ORDER BY created_at DESC',
      [courseId]
    );
    return result.rows;
  },

  async list({ page = 1, limit = 20, courseId, lessonId } = {}) {
    const conditions = [];
    const values = [];

    if (courseId) {
      conditions.push(`course_id = $${values.length + 1}`);
      values.push(courseId);
    }
    if (lessonId) {
      conditions.push(`lesson_id = $${values.length + 1}`);
      values.push(lessonId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM quizzes ${whereClause} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM quizzes WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default quizModel;
