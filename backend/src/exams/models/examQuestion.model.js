import { query } from '../../common/database/index.js';

export const examQuestionModel = {
  async addQuestion({ examId, questionId, orderIndex, marks, sectionName }) {
    if (orderIndex === undefined) {
      const last = await query(
        'SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM exam_questions WHERE exam_id = $1',
        [examId]
      );
      orderIndex = last.rows[0].next_order;
    }
    const result = await query(
      `INSERT INTO exam_questions (exam_id, question_id, order_index, marks, section_name)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (exam_id, question_id) DO NOTHING
       RETURNING *`,
      [examId, questionId, orderIndex, marks, sectionName]
    );
    return result.rows[0] || null;
  },

  async removeQuestion(examId, questionId) {
    await query('DELETE FROM exam_questions WHERE exam_id = $1 AND question_id = $2', [examId, questionId]);
  },

  async listByExam(examId, { shuffle = false } = {}) {
    const result = await query(
      `SELECT qq.*, q.question_text, q.question_type, q.options, q.marks AS question_marks,
              q.difficulty, q.topic_id, q.correct_answer, q.explanation
       FROM exam_questions qq
       JOIN questions q ON q.id = qq.question_id
       WHERE qq.exam_id = $1
       ORDER BY qq.order_index`,
      [examId]
    );
    return result.rows;
  },

  async countByExam(examId) {
    const result = await query(
      'SELECT COUNT(*)::int AS total, COALESCE(SUM(marks), 0) AS total_marks FROM exam_questions WHERE exam_id = $1',
      [examId]
    );
    return result.rows[0];
  },

  async clearExam(examId) {
    await query('DELETE FROM exam_questions WHERE exam_id = $1', [examId]);
  },
};

export default examQuestionModel;
