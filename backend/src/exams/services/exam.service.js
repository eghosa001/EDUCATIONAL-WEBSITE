import { query } from '../../common/database/index.js';
import examModel from '../models/exam.model.js';

export const examService = {
  async getById(id) {
    const exam = await examModel.findById(id);
    if (!exam) throw new Error('Exam not found');
    return exam;
  },

  async getBySlug(slug) {
    return await examModel.findBySlug(slug);
  },

  async create(data) {
    return await examModel.create(data);
  },

  async update(id, data) {
    return await examModel.update(id, data);
  },

  async list(params) {
    return await examModel.list(params);
  },

  async delete(id) {
    return await examModel.delete(id);
  },

  async getAttemptStats(examId) {
    const result = await query(
      `SELECT COUNT(*) as total,
              AVG(score) as avg_score,
              AVG(percentage) as avg_percentage,
              SUM(CASE WHEN is_passed = true THEN 1 ELSE 0 END) as passed_count
       FROM exam_attempts WHERE exam_id = $1`,
      [examId]
    );
    const row = result.rows[0];
    return {
      totalAttempts: parseInt(row?.total || 0),
      averageScore: row?.avg_score ? parseFloat(row.avg_score).toFixed(2) : 0,
      averagePercentage: row?.avg_percentage ? parseFloat(row.avg_percentage).toFixed(2) : 0,
      passRate: row?.total > 0 ? ((parseInt(row.passed_count) / parseInt(row.total)) * 100).toFixed(2) : 0,
    };
  },

  async getQuestionDistribution(examId) {
    const result = await query(
      `SELECT q.difficulty, COUNT(*) as count
       FROM exam_questions eq
       JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1
       GROUP BY q.difficulty`,
      [examId]
    );
    const distribution = {};
    for (const row of result.rows) {
      distribution[row.difficulty] = parseInt(row.count);
    }
    return distribution;
  },
};

export default examService;
