import { query } from '../../common/database/index.js';

export const examAnswerModel = {
  async create(data) {
    const { attemptId, questionId, studentAnswer, isCorrect, marksObtained, timeSpentSeconds } = data;
    const result = await query(
      `INSERT INTO exam_answers (attempt_id, question_id, student_answer, is_correct, marks_obtained, time_spent_seconds)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [attemptId, questionId, studentAnswer, isCorrect, marksObtained, timeSpentSeconds]
    );
    return result.rows[0];
  },

  async listByAttempt(attemptId) {
    const result = await query(
      `SELECT ea.*, q.question_text, q.question_type, q.options, q.correct_answer, q.explanation, q.marks
       FROM exam_answers ea
       JOIN questions q ON q.id = ea.question_id
       WHERE ea.attempt_id = $1
       ORDER BY ea.answered_at`,
      [attemptId]
    );
    return result.rows;
  },

  async deleteByAttempt(attemptId) {
    await query('DELETE FROM exam_answers WHERE attempt_id = $1', [attemptId]);
  },
};

export default examAnswerModel;
