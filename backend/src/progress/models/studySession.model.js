import { query } from '../../common/database/index.js';

export const studySessionModel = {
  async create(data) {
    const { studentId, courseId, lessonId, activityType, metadata } = data;
    const result = await query(
      `INSERT INTO study_sessions (student_id, course_id, lesson_id, activity_type, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [studentId, courseId, lessonId, activityType, metadata]
    );
    return result.rows[0];
  },

  async end(id) {
    const result = await query(
      `UPDATE study_sessions
       SET ended_at = NOW(), duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::int
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  },

  async totalStudyTime(studentId, fromDate, toDate) {
    const result = await query(
      `SELECT COALESCE(SUM(duration_seconds), 0)::int AS total_seconds
       FROM study_sessions
       WHERE student_id = $1 AND ended_at IS NOT NULL
         AND ($2::timestamptz IS NULL OR started_at >= $2)
         AND ($3::timestamptz IS NULL OR started_at <= $3)`,
      [studentId, fromDate, toDate]
    );
    return result.rows[0].total_seconds;
  },

  async listByStudent(studentId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      'SELECT * FROM study_sessions WHERE student_id = $1 ORDER BY started_at DESC LIMIT $2 OFFSET $3',
      [studentId, limit, offset]
    );
    return { data: result.rows, page, limit };
  },
};

export default studySessionModel;
