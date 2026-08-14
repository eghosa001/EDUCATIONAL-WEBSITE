import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import userModel from '../../users/models/user.model.js';
import teacherModel from '../models/teacher.model.js';

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

const mapLiveClass = (lc) => ({
  id: lc.id,
  teacherId: lc.teacher_id,
  courseId: lc.course_id,
  courseTitle: lc.course_title,
  title: lc.title,
  description: lc.description,
  scheduledAt: lc.scheduled_at,
  durationMinutes: lc.duration_minutes,
  status: lc.status,
  meetingUrl: lc.meeting_url,
  recordingUrl: lc.recording_url,
  studentCount: parseInt(lc.student_count || 0),
  createdAt: lc.created_at,
  updatedAt: lc.updated_at,
});

const mapEarning = (e) => ({
  id: e.id,
  teacherId: e.teacher_id,
  courseId: e.course_id,
  amount: parseFloat(e.amount),
  currency: e.currency,
  source: e.source,
  description: e.description,
  status: e.status,
  paidAt: e.paid_at,
  createdAt: e.created_at,
});

const mapAssignment = (a) => ({
  id: a.id,
  title: a.title,
  courseId: a.course_id,
  courseTitle: a.course_title,
  description: a.description,
  maxScore: a.max_score !== null ? parseFloat(a.max_score) : null,
  dueDate: a.due_date,
  isActive: a.is_active,
  submittedCount: parseInt(a.submitted_count || 0),
  totalStudents: parseInt(a.total_students || 0),
  createdAt: a.created_at,
});

const mapSubmission = (s) => ({
  id: s.id,
  assignmentId: s.assignment_id,
  studentId: s.student_id,
  studentName: `${s.first_name} ${s.last_name}`,
  email: s.email,
  avatar: s.avatar_url,
  content: s.content,
  fileUrls: s.file_urls,
  status: s.status,
  submittedAt: s.submitted_at,
  gradedAt: s.graded_at,
  gradedBy: s.graded_by,
  score: s.score !== null ? parseFloat(s.score) : null,
  feedback: s.feedback,
  isLate: s.is_late,
});

const mapExam = (e) => ({
  ...e,
  attemptCount: parseInt(e.attempt_count || 0),
});

export const teacherService = {
  async getOrCreateProfile(userId) {
    let teacher = await teacherModel.findByUserId(userId);
    if (!teacher) {
      teacher = await teacherModel.create({ userId });
    }
    return teacher;
  },

  async getProfile(userId) {
    const teacher = await this.getOrCreateProfile(userId);
    const user = await userModel.findById(userId);
    if (!user) notFound('User');

    return {
      id: teacher.id,
      userId: teacher.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone,
      avatar: teacher.avatar_url || user.avatar_url,
      bio: teacher.bio,
      qualification: teacher.qualification,
      specialization: teacher.specialization,
      payoutAccount: teacher.payout_account,
      verified: teacher.is_verified,
      rating: parseFloat(teacher.rating || 0),
      reviewCount: parseInt(teacher.review_count || 0),
      totalEarnings: parseFloat(teacher.total_earnings || 0),
      createdAt: teacher.created_at,
      updatedAt: teacher.updated_at,
    };
  },

  async updateProfile(userId, data) {
    await this.getOrCreateProfile(userId);

    const userData = {};
    if (data.firstName !== undefined) userData.firstName = data.firstName;
    if (data.lastName !== undefined) userData.lastName = data.lastName;
    if (data.avatarUrl !== undefined) userData.avatarUrl = data.avatarUrl;
    if (data.phone !== undefined) userData.phone = data.phone;
    if (Object.keys(userData).length > 0) {
      await userModel.update(userId, userData);
    }

    const teacher = await teacherModel.update(userId, {
      qualification: data.qualification,
      specialization: data.specialization,
      bio: data.bio,
      avatarUrl: data.avatarUrl,
      payoutAccount: data.payoutAccount,
    });
    if (!teacher) notFound('Teacher profile');

    return this.getProfile(userId);
  },

  async listCourses(teacherId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT c.*, s.name AS subject_name
       FROM courses c
       LEFT JOIN subjects s ON s.id = c.subject_id
       WHERE c.teacher_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [teacherId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM courses WHERE teacher_id = $1',
      [teacherId]
    );
    return {
      data: result.rows,
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async getCourseStats(teacherId, courseId) {
    const course = await query(
      'SELECT id FROM courses WHERE id = $1 AND teacher_id = $2',
      [courseId, teacherId]
    );
    if (course.rows.length === 0) notFound('Course');

    const result = await query(
      `SELECT
         COUNT(*)::int AS enrollment_count,
         COUNT(*) FILTER (WHERE completed_at IS NOT NULL)::int AS completed_count,
         COALESCE(AVG(progress_percentage), 0)::numeric(5,2) AS avg_progress
       FROM student_courses
       WHERE course_id = $1`,
      [courseId]
    );
    const row = result.rows[0];
    const total = row.enrollment_count;
    const completed = row.completed_count;
    return {
      courseId,
      enrollmentCount: total,
      completedCount: completed,
      completionRate: total > 0 ? parseFloat(((completed / total) * 100).toFixed(2)) : 0,
      avgProgress: parseFloat(row.avg_progress || 0),
    };
  },

  async listStudents(teacherId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url,
              MIN(sc.enrolled_at) AS enrolled_at,
              MAX(sc.progress_percentage) AS progress_percentage,
              MAX(sc.last_accessed_at) AS last_active_at
       FROM student_courses sc
       JOIN courses c ON c.id = sc.course_id
       JOIN users u ON u.id = sc.student_id
       WHERE c.teacher_id = $1
       GROUP BY u.id, u.first_name, u.last_name, u.email, u.avatar_url
       ORDER BY last_active_at DESC NULLS LAST
       LIMIT $2 OFFSET $3`,
      [teacherId, limit, offset]
    );
    const countResult = await query(
      `SELECT COUNT(DISTINCT sc.student_id)::int AS total
       FROM student_courses sc
       JOIN courses c ON c.id = sc.course_id
       WHERE c.teacher_id = $1`,
      [teacherId]
    );
    return {
      data: result.rows.map(r => ({
        id: r.id,
        userId: r.id,
        firstName: r.first_name,
        lastName: r.last_name,
        email: r.email,
        avatar: r.avatar_url,
        enrolledAt: r.enrolled_at,
        progressPercentage: parseFloat(r.progress_percentage || 0),
        lastActiveAt: r.last_active_at,
      })),
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async getStudentProgress(teacherId, studentUserId) {
    const result = await query(
      `SELECT sc.course_id, c.title, c.thumbnail_url,
              sc.progress_percentage, sc.enrolled_at, sc.last_accessed_at, sc.completed_at,
              (SELECT COUNT(*)::int FROM lesson_progress lp
               WHERE lp.student_id = sc.student_id AND lp.course_id = sc.course_id AND lp.status = 'completed') AS completed_lessons,
              (SELECT COUNT(*)::int FROM lessons l
               WHERE l.course_id = sc.course_id AND l.is_published = TRUE) AS total_lessons
       FROM student_courses sc
       JOIN courses c ON c.id = sc.course_id
       WHERE sc.student_id = $1 AND c.teacher_id = $2
       ORDER BY sc.last_accessed_at DESC NULLS LAST`,
      [studentUserId, teacherId]
    );
    return result.rows.map(r => ({
      courseId: r.course_id,
      courseTitle: r.title,
      thumbnailUrl: r.thumbnail_url,
      progressPercentage: parseFloat(r.progress_percentage || 0),
      completedLessons: r.completed_lessons,
      totalLessons: r.total_lessons,
      enrolledAt: r.enrolled_at,
      lastAccessedAt: r.last_accessed_at,
      completedAt: r.completed_at,
    }));
  },

  async listExams(teacherId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT e.*,
              (SELECT COUNT(*)::int FROM exam_attempts ea WHERE ea.exam_id = e.id) AS attempt_count
       FROM exams e
       WHERE e.created_by = $1
       ORDER BY e.created_at DESC
       LIMIT $2 OFFSET $3`,
      [teacherId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM exams WHERE created_by = $1',
      [teacherId]
    );
    return {
      data: result.rows.map(mapExam),
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async getExamStats(teacherId, examId) {
    const exam = await query(
      'SELECT id FROM exams WHERE id = $1 AND created_by = $2',
      [examId, teacherId]
    );
    if (exam.rows.length === 0) notFound('Exam');

    const result = await query(
      `SELECT
         COUNT(*)::int AS attempts,
         COUNT(DISTINCT student_id)::int AS students,
         COALESCE(AVG(percentage), 0)::numeric(5,2) AS avg_score,
         COUNT(*) FILTER (WHERE is_passed = TRUE)::int AS passed
       FROM exam_attempts
       WHERE exam_id = $1 AND status = 'submitted'`,
      [examId]
    );
    const row = result.rows[0];
    const attempts = row.attempts;
    const passed = row.passed;
    return {
      examId,
      attempts,
      students: row.students,
      avgScore: parseFloat(row.avg_score || 0),
      passRate: attempts > 0 ? parseFloat(((passed / attempts) * 100).toFixed(2)) : 0,
    };
  },

  async listAssignments(teacherId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT a.id, a.title, a.course_id, a.description, a.max_score, a.due_date, a.is_active, a.created_at,
              c.title AS course_title,
              (SELECT COUNT(*)::int FROM submissions s WHERE s.assignment_id = a.id) AS submitted_count,
              (SELECT COUNT(*)::int FROM student_courses sc WHERE sc.course_id = a.course_id) AS total_students
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       WHERE c.teacher_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [teacherId, limit, offset]
    );
    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       WHERE c.teacher_id = $1`,
      [teacherId]
    );
    return {
      data: result.rows.map(mapAssignment),
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async listAssignmentSubmissions(teacherId, assignmentId, { page = 1, limit = 20 } = {}) {
    const ownership = await query(
      `SELECT a.id
       FROM assignments a
       JOIN courses c ON c.id = a.course_id
       WHERE a.id = $1 AND c.teacher_id = $2`,
      [assignmentId, teacherId]
    );
    if (ownership.rows.length === 0) notFound('Assignment');

    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT s.*, u.first_name, u.last_name, u.email, u.avatar_url
       FROM submissions s
       JOIN users u ON u.id = s.student_id
       WHERE s.assignment_id = $1
       ORDER BY s.submitted_at DESC
       LIMIT $2 OFFSET $3`,
      [assignmentId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM submissions WHERE assignment_id = $1',
      [assignmentId]
    );
    return {
      data: result.rows.map(mapSubmission),
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async listLiveClasses(teacherId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT lc.*, c.title AS course_title
       FROM live_classes lc
       JOIN courses c ON c.id = lc.course_id
       WHERE lc.teacher_id = $1
       ORDER BY lc.scheduled_at DESC
       LIMIT $2 OFFSET $3`,
      [teacherId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM live_classes WHERE teacher_id = $1',
      [teacherId]
    );
    return {
      data: result.rows.map(mapLiveClass),
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async createLiveClass(teacherId, data) {
    const course = await query(
      'SELECT id FROM courses WHERE id = $1 AND teacher_id = $2',
      [data.courseId, teacherId]
    );
    if (course.rows.length === 0) notFound('Course');

    const result = await query(
      `INSERT INTO live_classes (teacher_id, course_id, title, description, scheduled_at, duration_minutes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [teacherId, data.courseId, data.title, data.description ?? null, data.scheduledAt, data.durationMinutes]
    );
    return this.getLiveClassById(result.rows[0].id);
  },

  async startLiveClass(teacherId, liveClassId) {
    const result = await query(
      `UPDATE live_classes SET status = 'live', updated_at = NOW()
       WHERE id = $1 AND teacher_id = $2
       RETURNING id`,
      [liveClassId, teacherId]
    );
    if (result.rows.length === 0) notFound('Live class');
    return this.getLiveClassById(liveClassId);
  },

  async endLiveClass(teacherId, liveClassId) {
    const result = await query(
      `UPDATE live_classes SET status = 'completed', updated_at = NOW()
       WHERE id = $1 AND teacher_id = $2
       RETURNING id`,
      [liveClassId, teacherId]
    );
    if (result.rows.length === 0) notFound('Live class');
    return this.getLiveClassById(liveClassId);
  },

  async getLiveClassById(liveClassId) {
    const result = await query(
      `SELECT lc.*, c.title AS course_title
       FROM live_classes lc
       JOIN courses c ON c.id = lc.course_id
       WHERE lc.id = $1`,
      [liveClassId]
    );
    if (result.rows.length === 0) notFound('Live class');
    return mapLiveClass(result.rows[0]);
  },

  async listEarnings(teacherId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT * FROM teacher_earnings
       WHERE teacher_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [teacherId, limit, offset]
    );
    const countResult = await query(
      'SELECT COUNT(*)::int AS total FROM teacher_earnings WHERE teacher_id = $1',
      [teacherId]
    );
    return {
      data: result.rows.map(mapEarning),
      pagination: paginate(countResult.rows[0].total, page, limit),
    };
  },

  async getEarningsSummary(teacherId) {
    const result = await query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0)::numeric(12,2) AS paid,
         COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0)::numeric(12,2) AS pending,
         COALESCE(SUM(amount) FILTER (WHERE status = 'failed'), 0)::numeric(12,2) AS failed,
         COALESCE(SUM(amount) FILTER (WHERE status <> 'failed'), 0)::numeric(12,2) AS total,
         COALESCE(SUM(amount) FILTER (WHERE status <> 'failed' AND created_at >= date_trunc('month', NOW())), 0)::numeric(12,2) AS this_month
       FROM teacher_earnings
       WHERE teacher_id = $1`,
      [teacherId]
    );
    const row = result.rows[0];
    return {
      total: parseFloat(row.total),
      pending: parseFloat(row.pending),
      paid: parseFloat(row.paid),
      failed: parseFloat(row.failed),
      thisMonth: parseFloat(row.this_month),
    };
  },

  async getAnalytics(teacherId) {
    const result = await query(
      `SELECT
         (SELECT COUNT(DISTINCT sc.student_id)::int
          FROM student_courses sc
          JOIN courses c ON c.id = sc.course_id
          WHERE c.teacher_id = $1) AS total_students,
         (SELECT COUNT(*)::int FROM courses WHERE teacher_id = $1) AS total_courses,
         (SELECT COUNT(*)::int FROM lessons l JOIN courses c ON c.id = l.course_id WHERE c.teacher_id = $1) AS total_lessons,
         (SELECT COUNT(*)::int FROM exams WHERE created_by = $1) AS total_exams,
         (SELECT COALESCE(AVG(rating), 0)::numeric(3,2) FROM courses WHERE teacher_id = $1) AS average_course_rating,
         (SELECT COALESCE(AVG(sc.progress_percentage), 0)::numeric(5,2)
          FROM student_courses sc
          JOIN courses c ON c.id = sc.course_id
          WHERE c.teacher_id = $1) AS average_student_progress,
         (SELECT COALESCE(SUM(amount), 0)::numeric(12,2) FROM teacher_earnings WHERE teacher_id = $1) AS total_earnings,
         (SELECT COALESCE(SUM(amount), 0)::numeric(12,2) FROM teacher_earnings WHERE teacher_id = $1 AND status = 'pending') AS pending_earnings`,
      [teacherId]
    );
    const row = result.rows[0];
    return {
      totalStudents: row.total_students,
      totalCourses: row.total_courses,
      totalLessons: row.total_lessons,
      totalExams: row.total_exams,
      averageCourseRating: parseFloat(row.average_course_rating || 0),
      averageStudentProgress: parseFloat(row.average_student_progress || 0),
      totalEarnings: parseFloat(row.total_earnings || 0),
      pendingEarnings: parseFloat(row.pending_earnings || 0),
    };
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
};

export default teacherService;
