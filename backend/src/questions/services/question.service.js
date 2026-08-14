import { query } from '../../common/database/index.js';
import questionModel from '../models/question.model.js';
import quizModel from '../../assessments/models/quiz.model.js';
import quizQuestionModel from '../../assessments/models/quizQuestion.model.js';

export const questionService = {
  async findById(id) {
    return questionModel.findById(id);
  },

  async create(data) {
    return questionModel.create(data);
  },

  async update(id, data) {
    return questionModel.update(id, data);
  },

  async list(params) {
    return questionModel.list(params);
  },

  async delete(id) {
    return questionModel.delete(id);
  },

  async getRandomQuestions(subjectId, topicId, count, difficulty) {
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

  async generateQuiz(courseId, params) {
    const { questionCount = 20, difficulty, subjectId, topicId, mode } = params;
    const questions = await this.getRandomQuestions(subjectId, topicId, questionCount, difficulty);
    return questions.slice(0, questionCount);
  },

  async getTopicStats(questionId) {
    const result = await query(
      `SELECT q.id, q.question_text, q.question_type, q.difficulty,
              COUNT(*) FILTER (WHERE ea.is_correct) as correct_count,
              COUNT(*) FILTER (WHERE NOT ea.is_correct) as wrong_count,
              COUNT(*) as total_attempts
       FROM questions q
       LEFT JOIN exam_answers ea ON ea.question_id = q.id
       LEFT JOIN exam_attempts exa ON ea.attempt_id = exa.id AND exa.status = 'submitted'
       WHERE q.id = $1
       GROUP BY q.id`,
      [questionId]
    );
    return result.rows[0];
  },
};

export default questionService;
