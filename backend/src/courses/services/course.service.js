import { query } from '../../common/database/index.js';
import courseModel from '../models/course.model.js';

export const courseService = {
  async getById(id) {
    const course = await courseModel.findById(id);
    if (!course) throw new Error('Course not found');
    return course;
  },

  async getBySlug(slug) {
    return await courseModel.findBySlug(slug);
  },

  async create(data) {
    return await courseModel.create(data);
  },

  async update(id, data) {
    return await courseModel.update(id, data);
  },

  async updateCounters(id, counters) {
    return await courseModel.updateCounters(id, counters);
  },

  async list(params) {
    return await courseModel.list(params);
  },

  async delete(id) {
    return await courseModel.delete(id);
  },

  async getEnrollmentStats(courseId) {
    const result = await query(
      `SELECT COUNT(*) as total FROM student_courses WHERE course_id = $1`,
      [courseId]
    );
    return { enrollmentCount: parseInt(result.rows[0]?.total || 0) };
  },

  async getCompletionRate(courseId) {
    const result = await query(
      `SELECT COUNT(*) as total, SUM(CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END) as completed
       FROM student_courses WHERE course_id = $1`,
      [courseId]
    );
    const row = result.rows[0];
    const total = parseInt(row?.total || 0);
    const completed = parseInt(row?.completed || 0);
    return {
      completionRate: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
      total,
      completed,
    };
  },
};

export default courseService;
