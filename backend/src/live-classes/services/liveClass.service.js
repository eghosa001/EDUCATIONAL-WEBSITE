import { query, getClient } from '../../common/database/index.js';
import { AppError } from '../../common/errors/index.js';
import { HTTP_STATUS } from '../../common/constants/index.js';

export const liveClassService = {
  async createClass(data) {
    const { title, description, subjectId, topicId, teacherId, scheduledAt, durationMinutes, maxParticipants, meetingUrl } = data;

    const result = await query(
      `INSERT INTO live_classes (title, description, subject_id, topic_id, teacher_id, scheduled_at, duration_minutes, max_participants, meeting_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled')
       RETURNING *`,
      [title, description, subjectId, topicId, teacherId, scheduledAt, durationMinutes, maxParticipants, meetingUrl]
    );
    return result.rows[0];
  },

  async updateClass(classId, data) {
    const result = await query(
      `UPDATE live_classes SET
         title = COALESCE($2, title),
         description = COALESCE($3, description),
         scheduled_at = COALESCE($4, scheduled_at),
         duration_minutes = COALESCE($5, duration_minutes),
         meeting_url = COALESCE($6, meeting_url),
         status = COALESCE($7, status)
       WHERE id = $1 RETURNING *`,
      [classId, data.title, data.description, data.scheduledAt, data.durationMinutes, data.meetingUrl, data.status]
    );
    return result.rows[0] || null;
  },

  async getUpcomingClasses(teacherId, limit = 10) {
    const result = await query(
      `SELECT lc.*, u.first_name, u.last_name, u.avatar
       FROM live_classes lc
       JOIN users u ON lc.teacher_id = u.id
       WHERE lc.teacher_id = $1 AND lc.status = 'scheduled' AND lc.scheduled_at > NOW()
       ORDER BY lc.scheduled_at ASC
       LIMIT $2`,
      [teacherId, limit]
    );
    return result.rows;
  },

  async getStudentClasses(userId, limit = 10) {
    const result = await query(
      `SELECT lc.*, u.first_name as teacher_name, u.last_name,
              la.status as attendance_status,
              la.joined_at
       FROM live_classes lc
       JOIN users u ON lc.teacher_id = u.id
       LEFT JOIN live_class_attendance la ON lc.id = la.class_id AND la.user_id = $1
       WHERE lc.status = 'scheduled' AND lc.scheduled_at > NOW()
       ORDER BY lc.scheduled_at ASC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async joinClass(classId, userId) {
    const class_ = await query('SELECT * FROM live_classes WHERE id = $1', [classId]);
    if (!class_.rows[0]) throw new AppError('Class not found', HTTP_STATUS.NOT_FOUND, 'CLASS_NOT_FOUND');

    if (class_.rows[0].status !== 'live' && class_.rows[0].status !== 'scheduled') {
      throw new AppError('Class is not available', HTTP_STATUS.BAD_REQUEST, 'CLASS_NOT_AVAILABLE');
    }

    const attendance = await query(
      `INSERT INTO live_class_attendance (class_id, user_id, status)
       VALUES ($1, $2, 'joined')
       ON CONFLICT (class_id, user_id)
       DO UPDATE SET status = 'joined', joined_at = NOW()
       RETURNING *`,
      [classId, userId]
    );
    return attendance.rows[0];
  },

  async leaveClass(classId, userId) {
    await query(
      `UPDATE live_class_attendance SET status = 'left', left_at = NOW()
       WHERE class_id = $1 AND user_id = $2`,
      [classId, userId]
    );
  },

  async endClass(classId) {
    const result = await query(
      `UPDATE live_classes SET status = 'ended' WHERE id = $1 RETURNING *`,
      [classId]
    );
    return result.rows[0];
  },

  async getClassParticipants(classId) {
    const result = await query(
      `SELECT lca.*, u.first_name, u.last_name, u.avatar,
              EXTRACT(EPOCH FROM (NOW() - lca.joined_at))::int as duration_seconds
       FROM live_class_attendance lca
       JOIN users u ON lca.user_id = u.id
       WHERE lca.class_id = $1 AND lca.status = 'joined'
       ORDER BY lca.joined_at ASC`,
      [classId]
    );
    return result.rows;
  },

  async markAttendance(classId, userId, status) {
    const result = await query(
      `UPDATE live_class_attendance
       SET status = $3, attended_at = NOW()
       WHERE class_id = $1 AND user_id = $2
       RETURNING *`,
      [classId, userId, status]
    );
    return result.rows[0];
  },

  async getClassAnalytics(classId) {
    const result = await query(
      `SELECT
         COUNT(*)::int as total_participants,
         COUNT(CASE WHEN status = 'joined' THEN 1 END)::int as present,
         COUNT(CASE WHEN status = 'left' THEN 1 END)::int as left_early,
         AVG(EXTRACT(EPOCH FROM (attended_at - joined_at))::int)::int as avg_duration_seconds
       FROM live_class_attendance
       WHERE class_id = $1`,
      [classId]
    );
    return result.rows[0];
  },
};

export default liveClassService;
