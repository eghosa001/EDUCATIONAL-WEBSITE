import { query } from '../../common/database/index.js';

export const liveClassModel = {
  async findById(id) {
    const result = await query(
      `SELECT lc.*, u.first_name, u.last_name, u.avatar_url as teacher_avatar,
              s.name as subject_title, s.code as subject_slug,
              t.name as topic_title
       FROM live_classes lc
       JOIN users u ON lc.teacher_id = u.id
       LEFT JOIN subjects s ON lc.subject_id = s.id
       LEFT JOIN topics t ON lc.topic_id = t.id
       WHERE lc.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findBySlug(slug) {
    const result = await query(
      `SELECT lc.*, u.first_name, u.last_name, u.avatar_url as teacher_avatar,
              s.name as subject_title, s.code as subject_slug,
              t.name as topic_title
       FROM live_classes lc
       JOIN users u ON lc.teacher_id = u.id
       LEFT JOIN subjects s ON lc.subject_id = s.id
       LEFT JOIN topics t ON lc.topic_id = t.id
       WHERE lc.slug = $1`,
      [slug]
    );
    return result.rows[0] || null;
  },

  async create(data) {
    const {
      title, description, subjectId, topicId, teacherId,
      scheduledAt, durationMinutes, maxParticipants, meetingUrl,
    } = data;

    const result = await query(
      `INSERT INTO live_classes (
          title, description, subject_id, topic_id, teacher_id,
          scheduled_at, duration_minutes, max_participants, meeting_url, status, slug
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'scheduled', $10)
        RETURNING *`,
      [
        title, description, subjectId, topicId, teacherId,
        scheduledAt, durationMinutes, maxParticipants, meetingUrl, data.slug,
      ]
    );
    return result.rows[0];
  },

  async update(id, data) {
    const result = await query(
      `UPDATE live_classes SET
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          scheduled_at = COALESCE($4, scheduled_at),
          duration_minutes = COALESCE($5, duration_minutes),
          max_participants = COALESCE($6, max_participants),
          meeting_url = COALESCE($7, meeting_url),
          status = COALESCE($8, status)
        WHERE id = $1
        RETURNING *`,
      [
        id, data.title, data.description, data.scheduledAt,
        data.durationMinutes, data.maxParticipants,
        data.meetingUrl, data.status,
      ]
    );
    return result.rows[0] || null;
  },

  async list({ page = 1, limit = 20, status, subjectId, teacherId, search } = {}) {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const conditions = [];
    const values = [];

    if (status) {
      conditions.push(`lc.status = $${values.length + 1}`);
      values.push(status);
    }
    if (subjectId) {
      conditions.push(`lc.subject_id = $${values.length + 1}`);
      values.push(subjectId);
    }
    if (teacherId) {
      conditions.push(`lc.teacher_id = $${values.length + 1}`);
      values.push(teacherId);
    }
    if (search) {
      conditions.push(`lc.title ILIKE $${values.length + 1}`);
      values.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (safePage - 1) * safeLimit;
    const pageValues = [...values, safeLimit, offset];

    const result = await query(
      `SELECT lc.*, u.first_name, u.last_name, u.avatar_url as teacher_avatar,
              s.name as subject_title, s.code as subject_slug
       FROM live_classes lc
       JOIN users u ON lc.teacher_id = u.id
       LEFT JOIN subjects s ON lc.subject_id = s.id
       ${whereClause}
       ORDER BY lc.scheduled_at ASC
       LIMIT $${pageValues.length - 1} OFFSET $${pageValues.length}`,
      pageValues
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM live_classes lc ${whereClause}`,
      values
    );
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

  async listByTeacher(teacherId, { page = 1, limit = 20 } = {}) {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const offset = (safePage - 1) * safeLimit;

    const result = await query(
      `SELECT lc.*, u.first_name, u.last_name,
              COUNT(lca.id)::int as participant_count
       FROM live_classes lc
       JOIN users u ON lc.teacher_id = u.id
       LEFT JOIN live_class_attendance lca ON lc.id = lca.class_id
       WHERE lc.teacher_id = $1
       GROUP BY lc.id, u.id
       ORDER BY lc.scheduled_at DESC
       LIMIT $2 OFFSET $3`,
      [teacherId, safeLimit, offset]
    );

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM live_classes WHERE teacher_id = $1`,
      [teacherId]
    );
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

  async delete(id) {
    const result = await query(
      'DELETE FROM live_classes WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  },

  async getAttendance(classId, userId) {
    const result = await query(
      `SELECT * FROM live_class_attendance WHERE class_id = $1 AND user_id = $2`,
      [classId, userId]
    );
    return result.rows[0] || null;
  },

  async countActiveParticipants(classId) {
    const result = await query(
      `SELECT COUNT(*)::int AS total
       FROM live_class_attendance
       WHERE class_id = $1 AND status IN ('joined', 'attended')`,
      [classId]
    );
    return Number(result.rows[0]?.total || 0);
  },

  async listAttendance(classId) {
    const result = await query(
      `SELECT lca.*, u.first_name, u.last_name, u.avatar_url as avatar,
              GREATEST(0, EXTRACT(EPOCH FROM (COALESCE(lca.left_at, NOW()) - lca.joined_at))::int) as duration_seconds
       FROM live_class_attendance lca
       JOIN users u ON lca.user_id = u.id
       WHERE lca.class_id = $1
       ORDER BY lca.joined_at ASC`,
      [classId]
    );
    return result.rows;
  },

  async upsertAttendance(classId, userId, status) {
    const result = await query(
      `INSERT INTO live_class_attendance (class_id, user_id, status, joined_at, left_at)
       VALUES ($1, $2, $3, NOW(), NULL)
       ON CONFLICT (class_id, user_id)
       DO UPDATE SET status = $3, joined_at = NOW(), left_at = NULL
       RETURNING *`,
      [classId, userId, status]
    );
    return result.rows[0];
  },

  async leaveClass(classId, userId) {
    const result = await query(
      `UPDATE live_class_attendance SET status = 'left', left_at = NOW()
       WHERE class_id = $1 AND user_id = $2
       RETURNING *`,
      [classId, userId]
    );
    return result.rows[0] || null;
  },

  async markAttendance(classId, userId, status) {
    const result = await query(
      `UPDATE live_class_attendance
       SET status = $3, attended_at = CASE WHEN $3 = 'attended' THEN NOW() ELSE attended_at END
       WHERE class_id = $1 AND user_id = $2
       RETURNING *`,
      [classId, userId, status]
    );
    return result.rows[0] || null;
  },

  async getAnalytics(classId) {
    const result = await query(
      `SELECT
          COUNT(*)::int as total_participants,
          COUNT(*) FILTER (WHERE status = 'joined')::int as present,
          COUNT(*) FILTER (WHERE status = 'left')::int as left_early,
          COUNT(*) FILTER (WHERE status = 'attended')::int as attended,
          AVG(EXTRACT(EPOCH FROM (COALESCE(left_at, attended_at, NOW()) - joined_at)))::int as avg_duration_seconds
       FROM live_class_attendance
       WHERE class_id = $1`,
      [classId]
    );
    return result.rows[0];
  },
};

export default liveClassModel;
