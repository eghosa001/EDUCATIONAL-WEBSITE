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
       SET ended_at = NOW(), duration_seconds = GREATEST(0, EXTRACT(EPOCH FROM (NOW() - started_at))::int)
       WHERE id = $1 AND ended_at IS NULL
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
    return Number(result.rows[0]?.total_seconds || 0);
  },

  async listByStudent(studentId, { page = 1, limit = 20 } = {}) {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;
    const [result, countResult] = await Promise.all([
      query(
        'SELECT * FROM study_sessions WHERE student_id = $1 ORDER BY started_at DESC, id LIMIT $2 OFFSET $3',
        [studentId, safeLimit, offset]
      ),
      query('SELECT COUNT(*)::int AS total FROM study_sessions WHERE student_id = $1', [studentId]),
    ]);
    const total = Number(countResult.rows[0]?.total || 0);
    return {
      data: result.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  },
};

export default studySessionModel;
