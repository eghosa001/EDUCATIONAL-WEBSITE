import { query } from '../../common/database/index.js';

export const examModel = {
  async findById(id) {
    const result = await query('SELECT * FROM exams WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query('SELECT * FROM exams WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      title, slug, description, examType, subjectId, classId, durationMinutes,
      totalMarks, passingMarks, instructions, startTime, endTime, isTimed,
      shuffleQuestions, showResultsImmediately, allowReview, maxAttempts,
      isActive, isPublic, createdBy,
    } = data;
    const result = await query(
      `INSERT INTO exams (
         title, slug, description, exam_type, subject_id, class_id, duration_minutes,
         total_marks, passing_marks, instructions, start_time, end_time, is_timed,
         shuffle_questions, show_results_immediately, allow_review, max_attempts,
         is_active, is_public, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        title, slug, description, examType, subjectId, classId, durationMinutes,
        totalMarks, passingMarks, instructions, startTime, endTime, isTimed,
        shuffleQuestions, showResultsImmediately, allowReview, maxAttempts,
        isActive, isPublic, createdBy,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE exams SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         exam_type = COALESCE($4, exam_type),
         duration_minutes = COALESCE($5, duration_minutes),
         passing_marks = COALESCE($6, passing_marks),
         instructions = COALESCE($7, instructions),
         start_time = COALESCE($8, start_time),
         end_time = COALESCE($9, end_time),
         is_timed = COALESCE($10, is_timed),
         shuffle_questions = COALESCE($11, shuffle_questions),
         show_results_immediately = COALESCE($12, show_results_immediately),
         allow_review = COALESCE($13, allow_review),
         max_attempts = COALESCE($14, max_attempts),
         is_active = COALESCE($15, is_active),
         is_public = COALESCE($16, is_public)
       WHERE id = $1
       RETURNING *`,
      [
        id, data.title, data.description, data.examType, data.durationMinutes,
        data.passingMarks, data.instructions, data.startTime, data.endTime,
        data.isTimed, data.shuffleQuestions, data.showResultsImmediately,
        data.allowReview, data.maxAttempts, data.isActive, data.isPublic,
      ]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, examType, subjectId, classId, isPublic } = {}) {
    const conditions = [];
    const values = [];

    if (examType) {
      conditions.push(`exam_type = $${values.length + 1}`);
      values.push(examType);
    }
    if (subjectId) {
      conditions.push(`subject_id = $${values.length + 1}`);
      values.push(subjectId);
    }
    if (classId) {
      conditions.push(`class_id = $${values.length + 1}`);
      values.push(classId);
    }
    if (isPublic !== undefined) {
      conditions.push(`is_public = $${values.length + 1}`);
      values.push(isPublic);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const result = await query(
      `SELECT * FROM exams ${whereClause} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    return { data: result.rows, page, limit };
  },

  async delete(id) {
    const result = await query('DELETE FROM exams WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  },
};

export default examModel;
