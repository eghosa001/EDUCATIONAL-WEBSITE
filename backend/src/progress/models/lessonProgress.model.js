import { query } from '../../common/database/index.js';

export const lessonProgressModel = {
  async findByStudentAndLesson(studentId, lessonId) {
    const result = await query(
      'SELECT * FROM lesson_progress WHERE student_id = $1 AND lesson_id = $2',
      [studentId, lessonId]
    );
    return result.rows[0] || null;
  },

  async upsert(data) {
    const { studentId, lessonId, courseId, status, progressPercentage, watchTimeSeconds, lastPositionSeconds } = data;
    const result = await query(
      `INSERT INTO lesson_progress (student_id, lesson_id, course_id, status, progress_percentage, watch_time_seconds, last_position_seconds)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (student_id, lesson_id)
       DO UPDATE SET
         status = CASE WHEN lesson_progress.status = 'completed' THEN 'completed' ELSE $4 END,
         progress_percentage = $5,
         watch_time_seconds = $6,
         last_position_seconds = $7,
         completed_at = CASE WHEN $4 = 'completed' AND lesson_progress.completed_at IS NULL THEN NOW() ELSE lesson_progress.completed_at END,
         updated_at = NOW()
       RETURNING *`,
      [studentId, lessonId, courseId, status, progressPercentage, watchTimeSeconds, lastPositionSeconds]
    );
    return result.rows[0];
  },

  async markComplete(studentId, lessonId, courseId) {
    const result = await query(
      `INSERT INTO lesson_progress (student_id, lesson_id, course_id, status, progress_percentage, completed_at)
       VALUES ($1, $2, $3, 'completed', 100, NOW())
       ON CONFLICT (student_id, lesson_id)
       DO UPDATE SET status = 'completed', progress_percentage = 100, completed_at = NOW(), updated_at = NOW()
       RETURNING *`,
      [studentId, lessonId, courseId]
    );
    return result.rows[0];
  },

  async listByStudentAndCourse(studentId, courseId) {
    const result = await query(
      'SELECT * FROM lesson_progress WHERE student_id = $1 AND course_id = $2 ORDER BY updated_at DESC',
      [studentId, courseId]
    );
    return result.rows;
  },

  async countCompletedByCourse(studentId, courseId) {
    const result = await query(
      `SELECT COUNT(*)::int AS completed
       FROM lesson_progress
       WHERE student_id = $1 AND course_id = $2 AND status = 'completed'`,
      [studentId, courseId]
    );
    return result.rows[0].completed;
  },
};

export default lessonProgressModel;
