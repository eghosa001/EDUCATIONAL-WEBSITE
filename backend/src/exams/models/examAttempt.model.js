import { query, transaction } from '../../common/database/index.js';

export const examAttemptModel = {
  async findById(id) {
    const result = await query('SELECT * FROM exam_attempts WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create({ examId, studentId }) {
    const result = await query(
      `INSERT INTO exam_attempts (exam_id, student_id, attempt_number)
       SELECT $1, $2, COALESCE(MAX(attempt_number), 0) + 1
       FROM exam_attempts
       WHERE exam_id = $1 AND student_id = $2
       RETURNING *`,
      [examId, studentId]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE exam_attempts SET
         status = COALESCE($2, status),
         submitted_at = COALESCE($3, submitted_at),
         time_spent_seconds = COALESCE($4, time_spent_seconds),
         score = COALESCE($5, score),
         percentage = COALESCE($6, percentage),
         is_passed = COALESCE($7, is_passed),
         rank = COALESCE($8, rank),
         total_students = COALESCE($9, total_students),
         metadata = COALESCE($10, metadata)
       WHERE id = $1
       RETURNING *`,
      [
        id, data.status, data.submittedAt, data.timeSpentSeconds, data.score,
        data.percentage, data.isPassed, data.rank, data.totalStudents, data.metadata,
      ]
    );
    return result.rows[0] || null;
  },

  async submitWithAnswers(attemptId, answers, grade) {
    return transaction(async (client) => {
      await client.query(
        `UPDATE exam_attempts SET
           status = 'submitted',
           submitted_at = NOW(),
           time_spent_seconds = $2,
           score = $3,
           percentage = $4,
           is_passed = $5
         WHERE id = $1`,
        [attemptId, grade.timeSpentSeconds, grade.score, grade.percentage, grade.isPassed]
      );

      for (const answer of answers) {
        await client.query(
          `INSERT INTO exam_answers (attempt_id, question_id, student_answer, is_correct, marks_obtained, time_spent_seconds)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [attemptId, answer.questionId, JSON.stringify(answer.studentAnswer), answer.isCorrect, answer.marksObtained, answer.timeSpentSeconds]
        );
      }

      const { rows } = await client.query('SELECT * FROM exam_attempts WHERE id = $1', [attemptId]);
      return rows[0];
    });
  },

  async countAttemptsByStudent(examId, studentId) {
    const result = await query(
      'SELECT COUNT(*)::int AS total FROM exam_attempts WHERE exam_id = $1 AND student_id = $2',
      [examId, studentId]
    );
    return result.rows[0].total;
  },

  async listByExam(examId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT ea.*, u.first_name, u.last_name, u.email
       FROM exam_attempts ea
       JOIN users u ON u.id = ea.student_id
       WHERE ea.exam_id = $1
       ORDER BY ea.score DESC NULLS LAST
       LIMIT $2 OFFSET $3`,
      [examId, limit, offset]
    );
    return { data: result.rows, page, limit };
  },

  async listByStudent(studentId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT ea.*, e.title, e.slug, e.subject_id, e.class_id
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       WHERE ea.student_id = $1
       ORDER BY ea.started_at DESC
       LIMIT $2 OFFSET $3`,
      [studentId, limit, offset]
    );
    return { data: result.rows, page, limit };
  },
};

export default examAttemptModel;
