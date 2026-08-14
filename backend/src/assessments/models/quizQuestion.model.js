import { query } from '../../common/database/index.js';

export const quizQuestionModel = {
  async addQuestion({ quizId, questionId, orderIndex, marks }) {
    const result = await query(
      `INSERT INTO quiz_questions (quiz_id, question_id, order_index, marks)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (quiz_id, question_id) DO NOTHING
       RETURNING *`,
      [quizId, questionId, orderIndex, marks]
    );
    return result.rows[0] || null;
  },

  async removeQuestion(quizId, questionId) {
    await query('DELETE FROM quiz_questions WHERE quiz_id = $1 AND question_id = $2', [quizId, questionId]);
  },

  async listByQuiz(quizId) {
    const result = await query(
      `SELECT qq.*, q.question_text, q.question_type, q.options, q.marks AS question_marks,
              q.difficulty, q.topic_id
       FROM quiz_questions qq
       JOIN questions q ON q.id = qq.question_id
       WHERE qq.quiz_id = $1
       ORDER BY qq.order_index`,
      [quizId]
    );
    return result.rows;
  },

  async countByQuiz(quizId) {
    const result = await query(
      'SELECT COUNT(*)::int AS total FROM quiz_questions WHERE quiz_id = $1',
      [quizId]
    );
    return result.rows[0].total;
  },
};

export default quizQuestionModel;
