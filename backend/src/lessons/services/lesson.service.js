import { query } from '../../common/database/index.js';
import lessonModel from '../models/lesson.model.js';

export const lessonService = {
  async getById(id) {
    const lesson = await lessonModel.findById(id);
    if (!lesson) throw new Error('Lesson not found');
    return lesson;
  },

  async findBySlug(courseId, slug) {
    return await lessonModel.findBySlug(courseId, slug);
  },

  async create(data) {
    return await lessonModel.create(data);
  },

  async update(id, data) {
    return await lessonModel.update(id, data);
  },

  async incrementViews(id) {
    await lessonModel.incrementViews(id);
  },

  async incrementCompletions(id) {
    await lessonModel.incrementCompletions(id);
  },

  async listByCourse(courseId) {
    return await lessonModel.listByCourse(courseId);
  },

  async list(params) {
    return await lessonModel.list(params);
  },

  async delete(id) {
    return await lessonModel.delete(id);
  },

  async getProgressStats(courseId, studentId) {
    const result = await query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN lp.status = 'completed' THEN 1 ELSE 0 END) as completed,
              AVG(lp.progress_percentage) as avg_progress,
              SUM(lp.watch_time_seconds) as total_watch_time
       FROM lessons l
       LEFT JOIN lesson_progress lp ON l.id = lp.lesson_id AND lp.student_id = $2
       WHERE l.course_id = $1`,
      [courseId, studentId]
    );
    const row = result.rows[0];
    const total = parseInt(row?.total || 0);
    const completed = parseInt(row?.completed || 0);
    return {
      totalLessons: total,
      completedLessons: completed,
      progressPercentage: total > 0 ? ((completed / total) * 100).toFixed(2) : 0,
      averageProgress: row?.avg_progress ? parseFloat(row.avg_progress).toFixed(2) : 0,
      totalWatchTimeSeconds: parseInt(row?.total_watch_time || 0),
    };
  },

  async getLessonPerformance(courseId) {
    const result = await query(
      `SELECT l.id, l.title, l.view_count, l.completion_count,
              ROUND((l.completion_count::float / NULLIF(l.view_count, 0)) * 100, 2) as completion_rate
       FROM lessons l
       WHERE l.course_id = $1
       ORDER BY l.order_index`,
      [courseId]
    );
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      views: parseInt(row.view_count || 0),
      completions: parseInt(row.completion_count || 0),
      completionRate: parseFloat(row.completion_rate || 0),
    }));
  },
};

export default lessonService;
