import { query } from '../../common/database/index.js';
import quizModel from '../models/quiz.model.js';
import quizQuestionModel from '../models/quizQuestion.model.js';

export const assessmentService = {
  async list(params) {
    return quizModel.list(params);
  },

  async getById(id) {
    const quiz = await quizModel.findById(id);
    if (!quiz) throw new Error('Quiz not found');
    return quiz;
  },

  async create(data) {
    return quizModel.create(data);
  },

  async update(id, data) {
    return quizModel.update(id, data);
  },

  async delete(id) {
    return quizModel.delete(id);
  },

  async addQuestion(quizId, data) {
    return quizQuestionModel.addQuestion({ quizId, ...data });
  },

  async removeQuestion(quizId, questionId) {
    return quizQuestionModel.removeQuestion(quizId, questionId);
  },

  async getQuestions(quizId) {
    return quizQuestionModel.listByQuiz(quizId);
  },

  async generateQuizFromQuestions(courseId, params) {
    const { subjectId, topicId, count = 10, difficulty } = params;
    const conditions = [];
    const values = [];
    if (subjectId) { conditions.push(`subject_id = $${values.length + 1}`); values.push(subjectId); }
    if (topicId) { conditions.push(`topic_id = $${values.length + 1}`); values.push(topicId); }
    if (difficulty) { conditions.push(`difficulty = $${values.length + 1}`); values.push(difficulty); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT * FROM questions ${where} ORDER BY RANDOM() LIMIT $${values.length + 1}`,
      [...values, count]
    );
    return result.rows;
  },

  async getQuizAttemptStats(quizId) {
    const result = await query(
      `SELECT COUNT(*)::int as attempts, AVG(score) as avg_score, AVG(percentage) as avg_pct
       FROM quiz_attempts WHERE quiz_id = $1 AND status = 'completed'`,
      [quizId]
    );
    return result.rows[0];
  },
};

export default assessmentService;
