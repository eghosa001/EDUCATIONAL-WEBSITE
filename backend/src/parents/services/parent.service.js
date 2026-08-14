import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES, ConflictError } from '../../common/errors/index.js';
import userModel from '../../users/models/user.model.js';
import progressService from '../../progress/services/progress.service.js';
import parentModel from '../models/parent.model.js';
import parentChildModel from '../models/parentChild.model.js';

const notFound = (message) => {
  throw new AppError(message, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const paginate = (total, page, limit) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

const mapNotification = (n) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  message: n.body,
  data: n.data,
  isRead: n.read_at !== null,
  actionUrl: n.action_url,
  channel: n.channel,
  sentAt: n.sent_at,
  createdAt: n.created_at,
});

const mapChild = (pc) => ({
  id: pc.id,
  userId: pc.child_user_id,
  firstName: pc.first_name,
  lastName: pc.last_name,
  email: pc.email,
  avatar: pc.avatar_url,
  relationship: pc.relationship,
  preferredContactMethod: pc.preferred_contact_method,
  notificationsEnabled: pc.notifications_enabled,
  schoolId: null,
  classId: null,
  joinedAt: pc.created_at,
});

const mapReport = (r) => ({
  id: r.id,
  title: r.title,
  description: r.description,
  type: r.type,
  childId: r.filters?.childId ?? null,
  childName: r.filters?.childName ?? null,
  data: r.filters?.data ?? r.filters ?? {},
  status: r.status,
  errorMessage: r.error_message,
  fileUrl: r.file_url,
  generatedBy: r.generated_by,
  generatedAt: r.created_at,
  completedAt: r.completed_at,
});

export const parentService = {
  async getOrCreateProfile(userId) {
    let parent = await parentModel.findByUserId(userId);
    if (!parent) {
      parent = await parentModel.create({ userId });
    }
    return parent;
  },

  async getProfile(userId) {
    const parent = await this.getOrCreateProfile(userId);
    const user = await userModel.findById(userId);
    if (!user) notFound('User');

    return {
      id: parent.id,
      userId: parent.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: parent.phone || user.phone,
      avatar: user.avatar_url,
      occupation: parent.occupation,
      address: parent.address,
      createdAt: parent.created_at,
      updatedAt: parent.updated_at,
    };
  },

  async updateProfile(userId, data) {
    await this.getOrCreateProfile(userId);

    const userData = {};
    if (data.firstName !== undefined) userData.firstName = data.firstName;
    if (data.lastName !== undefined) userData.lastName = data.lastName;
    if (data.avatarUrl !== undefined) userData.avatarUrl = data.avatarUrl;
    if (Object.keys(userData).length > 0) {
      await userModel.update(userId, userData);
    }

    const parent = await parentModel.update(userId, {
      occupation: data.occupation,
      phone: data.phone,
      address: data.address,
    });
    if (!parent) notFound('Parent profile');

    return this.getProfile(userId);
  },

  async getChildren(parentUserId) {
    const parent = await parentModel.findByUserId(parentUserId);
    if (!parent) return [];
    const rows = await parentChildModel.listByParent(parent.id);
    return rows.map(mapChild);
  },

  async addChild(parentUserId, childUserId) {
    const parent = await this.getOrCreateProfile(parentUserId);
    const child = await userModel.findById(childUserId);
    if (!child) notFound('Child user');

    const existing = await parentChildModel.findByParentAndChild(parent.id, childUserId);
    if (existing) throw new ConflictError('Child is already linked to your account');

    const link = await parentChildModel.create({ parentId: parent.id, childUserId });
    return { link, child };
  },

  async removeChild(parentUserId, childUserId) {
    const parent = await parentModel.findByUserId(parentUserId);
    if (!parent) notFound('Parent profile');

    const deleted = await parentChildModel.delete(parent.id, childUserId);
    if (!deleted) notFound('Child link');
    return deleted;
  },

  async assertChildLinked(parentUserId, childUserId) {
    const parent = await parentModel.findByUserId(parentUserId);
    if (!parent) notFound('Parent profile');

    const link = await parentChildModel.findByParentAndChild(parent.id, childUserId);
    if (!link) notFound('Child');
    return { parent, link };
  },

  async getChildPerformance(parentUserId, childUserId) {
    await this.assertChildLinked(parentUserId, childUserId);

    const [studyResult, coursesResult, lessonsResult, examsResult, pointsResult, lastActiveResult] = await Promise.all([
      query(
        `SELECT COALESCE(SUM(duration_seconds), 0)::int AS total
         FROM study_sessions
         WHERE student_id = $1 AND ended_at IS NOT NULL`,
        [childUserId]
      ),
      query(
        `SELECT COUNT(*)::int AS total, COUNT(completed_at)::int AS completed
         FROM student_courses
         WHERE student_id = $1`,
        [childUserId]
      ),
      query(
        `SELECT COUNT(*)::int AS total
         FROM lesson_progress
         WHERE student_id = $1 AND status = 'completed'`,
        [childUserId]
      ),
      query(
        `SELECT COUNT(DISTINCT exam_id)::int AS taken,
                COALESCE(AVG(percentage), 0)::numeric(5,2) AS avg_score
         FROM exam_attempts
         WHERE student_id = $1 AND status = 'submitted'`,
        [childUserId]
      ),
      query(
        'SELECT current_streak FROM student_points WHERE user_id = $1',
        [childUserId]
      ),
      query(
        `SELECT MAX(last_active_at) AS last_active_at FROM (
           SELECT last_accessed_at AS last_active_at FROM student_courses WHERE student_id = $1
           UNION ALL
           SELECT started_at AS last_active_at FROM study_sessions WHERE student_id = $1
         ) t`,
        [childUserId]
      ),
    ]);

    return {
      userId: childUserId,
      studyTimeSeconds: parseInt(studyResult.rows[0].total || 0),
      coursesEnrolled: coursesResult.rows[0].total,
      coursesCompleted: coursesResult.rows[0].completed,
      lessonsCompleted: lessonsResult.rows[0].total,
      examsTaken: examsResult.rows[0].taken,
      averageExamScore: parseFloat(examsResult.rows[0].avg_score || 0),
      currentStreak: parseInt(pointsResult.rows[0]?.current_streak || 0),
      lastActiveAt: lastActiveResult.rows[0].last_active_at || null,
    };
  },

  async getChildCourses(parentUserId, childUserId, { page = 1, limit = 20 } = {}) {
    await this.assertChildLinked(parentUserId, childUserId);

    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT sc.*, c.title, c.slug, c.thumbnail_url, c.subject_id, c.class_id, c.teacher_id
       FROM student_courses sc
       JOIN courses c ON c.id = sc.course_id
       WHERE sc.student_id = $1
       ORDER BY sc.last_accessed_at DESC NULLS LAST
       LIMIT $2 OFFSET $3`,
      [childUserId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM student_courses WHERE student_id = $1',
      [childUserId]
    );
    return {
      data: result.rows,
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async getChildExams(parentUserId, childUserId, { page = 1, limit = 20 } = {}) {
    await this.assertChildLinked(parentUserId, childUserId);

    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT ea.*, e.title, e.slug, e.exam_type, e.subject_id, e.class_id,
              e.duration_minutes, e.total_marks, e.passing_marks
       FROM exam_attempts ea
       JOIN exams e ON e.id = ea.exam_id
       WHERE ea.student_id = $1
       ORDER BY ea.started_at DESC
       LIMIT $2 OFFSET $3`,
      [childUserId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM exam_attempts WHERE student_id = $1',
      [childUserId]
    );
    return {
      data: result.rows,
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async getChildProgress(parentUserId, childUserId) {
    await this.assertChildLinked(parentUserId, childUserId);
    return progressService.getOverview(childUserId);
  },

  async getChildStudyTime(parentUserId, childUserId, { startDate, endDate } = {}) {
    await this.assertChildLinked(parentUserId, childUserId);

    const result = await query(
      `SELECT to_char(date_trunc('day', started_at), 'YYYY-MM-DD') AS date,
              COALESCE(SUM(duration_seconds), 0)::int AS study_time_seconds,
              COALESCE(array_agg(DISTINCT course_id) FILTER (WHERE course_id IS NOT NULL), ARRAY[]::uuid[]) AS course_ids
       FROM study_sessions
       WHERE student_id = $1 AND ended_at IS NOT NULL
         AND ($2::timestamptz IS NULL OR started_at >= $2)
         AND ($3::timestamptz IS NULL OR started_at < ($3::timestamptz + interval '1 day'))
       GROUP BY date_trunc('day', started_at)
       ORDER BY date ASC`,
      [childUserId, startDate || null, endDate || null]
    );
    return result.rows.map(r => ({
      date: r.date,
      studyTimeSeconds: parseInt(r.study_time_seconds || 0),
      coursesStudied: r.course_ids || [],
    }));
  },

  async listNotifications(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM notifications WHERE user_id = $1',
      [userId]
    );
    return {
      data: result.rows.map(mapNotification),
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async markNotificationRead(userId, notificationId) {
    const result = await query(
      `UPDATE notifications SET read_at = COALESCE(read_at, NOW())
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    if (result.rows.length === 0) notFound('Notification');
    return mapNotification(result.rows[0]);
  },

  async listReports(parentUserId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM reports
       WHERE generated_by = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [parentUserId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM reports WHERE generated_by = $1',
      [parentUserId]
    );
    return {
      data: result.rows.map(mapReport),
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async generateReport(parentUserId, { childId, reportType }) {
    await this.assertChildLinked(parentUserId, childId);

    const child = await userModel.findById(childId);
    if (!child) notFound('Child user');
    const childName = `${child.first_name} ${child.last_name}`;

    const [performance, progress, courses, exams] = await Promise.all([
      this.getChildPerformance(parentUserId, childId),
      progressService.getOverview(childId),
      this.getChildCourses(parentUserId, childId, { page: 1, limit: 100 }),
      this.getChildExams(parentUserId, childId, { page: 1, limit: 100 }),
    ]);

    const result = await query(
      `INSERT INTO reports (type, title, description, filters, generated_by, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, 'completed', NOW())
       RETURNING *`,
      [
        reportType,
        `${reportType.charAt(0).toUpperCase()}${reportType.slice(1)} report for ${childName}`,
        `Academic progress report for ${childName}`,
        {
          childId,
          childName,
          data: {
            childId,
            childName,
            reportType,
            performance,
            progress,
            courses: courses.data,
            exams: exams.data,
          },
        },
        parentUserId,
      ]
    );
    return mapReport(result.rows[0]);
  },

  async getReport(parentUserId, reportId) {
    const result = await query(
      'SELECT * FROM reports WHERE id = $1 AND generated_by = $2',
      [reportId, parentUserId]
    );
    if (result.rows.length === 0) notFound('Report');
    return mapReport(result.rows[0]);
  },
};

export default parentService;
