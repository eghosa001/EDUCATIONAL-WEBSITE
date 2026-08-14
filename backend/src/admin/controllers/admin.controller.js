import { query } from '../../common/database/index.js';
import { config } from '../../common/config/index.js';
import { asyncHandler } from '../../common/middleware/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { USER_ROLES, COURSE_STATUS, CONTENT_WORKFLOW_STATUS } from '../../common/constants/index.js';

const notFound = (resource) => {
  throw new AppError(`${resource} not found`, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
};

const mapAuditLog = (log) => ({
  id: log.id,
  userId: log.user_id,
  action: log.action,
  resourceType: log.resource_type,
  resourceId: log.resource_id,
  changes: log.changes,
  ipAddress: log.ip_address,
  userAgent: log.user_agent,
  metadata: log.metadata,
  createdAt: log.created_at,
});

const mapSetting = (s) => ({
  key: s.key,
  value: s.value,
  updatedBy: s.updated_by,
  updatedAt: s.updated_at,
});

export const getDashboard = asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM users WHERE role = 'student') AS total_students,
       (SELECT COUNT(*)::int FROM users WHERE role = 'teacher') AS total_teachers,
       (SELECT COUNT(*)::int FROM users WHERE role = 'parent') AS total_parents,
       (SELECT COUNT(*)::int FROM schools WHERE status = 'active') AS total_schools,
       (SELECT COUNT(*)::int FROM users WHERE last_login_at >= CURRENT_DATE) AS active_today,
       (SELECT COUNT(*)::int FROM courses) AS courses,
       (SELECT COUNT(*)::int FROM lessons WHERE is_published = TRUE) AS lessons,
       (SELECT COUNT(*)::int FROM questions WHERE is_active = TRUE) AS questions,
       (SELECT COUNT(*)::int FROM exams WHERE is_active = TRUE) AS exams,
       (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'active') AS subscribers,
       (SELECT COALESCE(SUM(amount), 0)::numeric(12,2) FROM payments WHERE status = 'completed' AND paid_at >= date_trunc('month', NOW())) AS monthly_revenue`
  );
  const recentUsers = await query(
    `SELECT id, email, first_name, last_name, role, created_at
     FROM users ORDER BY created_at DESC LIMIT 5`
  );
  const popularSubjects = await query(
    `SELECT s.name, s.code, COUNT(sc.id)::int AS enrollments
     FROM subjects s
     JOIN courses c ON c.subject_id = s.id
     JOIN student_courses sc ON sc.course_id = c.id
     GROUP BY s.id, s.name, s.code
     ORDER BY enrollments DESC LIMIT 5`
  );
  const pendingContent = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM courses WHERE status = 'pending_review') AS courses_pending,
       (SELECT COUNT(*)::int FROM lessons WHERE is_published = FALSE) AS lessons_unpublished`
  );

  const row = result.rows[0];
  res.json({
    success: true,
    data: {
      stats: {
        totalStudents: parseInt(row.total_students),
        totalTeachers: parseInt(row.total_teachers),
        totalParents: parseInt(row.total_parents),
        totalSchools: parseInt(row.total_schools),
        activeToday: parseInt(row.active_today),
        courses: parseInt(row.courses),
        lessons: parseInt(row.lessons),
        questions: parseInt(row.questions),
        exams: parseInt(row.exams),
        subscribers: parseInt(row.subscribers),
        monthlyRevenue: parseFloat(row.monthly_revenue),
      },
      recentUsers: recentUsers.rows.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        role: u.role,
        createdAt: u.created_at,
      })),
      popularSubjects: popularSubjects.rows.map(s => ({
        name: s.name,
        code: s.code,
        enrollments: s.enrollments,
      })),
      pendingContent: {
        coursesPendingReview: parseInt(pendingContent.rows[0].courses_pending),
        lessonsUnpublished: parseInt(pendingContent.rows[0].lessons_unpublished),
      },
    },
  });
});

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countResult = await query('SELECT COUNT(*)::int AS total FROM audit_logs');
  res.json({
    success: true,
    data: { logs: result.rows.map(mapAuditLog) },
    pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) },
  });
});

export const getSettings = asyncHandler(async (req, res) => {
  const result = await query('SELECT * FROM system_settings ORDER BY key');
  res.json({ success: true, data: { settings: result.rows.map(mapSetting) } });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  for (const { key, value } of updates) {
    await query(
      `INSERT INTO system_settings (key, value, updated_by) VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = NOW()`,
      [key, JSON.stringify(value), req.user.id]
    );
  }
  const result = await query('SELECT * FROM system_settings ORDER BY key');
  res.json({ success: true, data: { settings: result.rows.map(mapSetting) } });
});

export const getPendingContent = asyncHandler(async (req, res) => {
  const [courses, lessons] = await Promise.all([
    query(`SELECT c.*, u.first_name, u.last_name, u.email FROM courses c JOIN users u ON u.id = c.teacher_id WHERE c.status = 'pending_review' ORDER BY c.updated_at DESC`),
    query(`SELECT l.*, c.title as course_title, u.first_name, u.last_name FROM lessons l JOIN courses c ON c.id = l.course_id JOIN users u ON u.id = c.teacher_id WHERE l.is_published = FALSE ORDER BY l.updated_at DESC`),
  ]);
  res.json({
    success: true,
    data: {
      courses: courses.rows.map(c => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        teacher: { firstName: c.first_name, lastName: c.last_name, email: c.email },
        updatedAt: c.updated_at,
      })),
      lessons: lessons.rows.map(l => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        courseTitle: l.course_title,
        teacher: { firstName: l.first_name, lastName: l.last_name },
        updatedAt: l.updated_at,
      })),
    },
  });
});

export const approveContent = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  if (type === 'course') {
    const result = await query(
      `UPDATE courses SET status = 'published', published_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (!result.rows[0]) notFound('Course');
  } else if (type === 'lesson') {
    const result = await query(
      `UPDATE lessons SET is_published = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (!result.rows[0]) notFound('Lesson');
  } else {
    throw new AppError('Invalid content type', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  res.json({ success: true, message: `${type} approved` });
});

export const rejectContent = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  if (type === 'course') {
    const result = await query(
      `UPDATE courses SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (!result.rows[0]) notFound('Course');
  } else if (type === 'lesson') {
    const result = await query(
      `UPDATE lessons SET is_published = FALSE, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (!result.rows[0]) notFound('Lesson');
  } else {
    throw new AppError('Invalid content type', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  }
  res.json({ success: true, message: `${type} rejected` });
});

export const listModerationPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const result = await query(
    `SELECT cp.*, u.first_name, u.last_name, u.email
     FROM community_posts cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.status = 'published'
     ORDER BY cp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM community_posts WHERE status = 'published'`);
  res.json({
    success: true,
    data: { posts: result.rows },
    pagination: { page, limit, total: parseInt(countResult.rows[0].total), totalPages: Math.ceil(countResult.rows[0].total / limit) },
  });
});

export const hidePost = asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE community_posts SET status = 'hidden', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.postId]
  );
  if (!result.rows[0]) notFound('Post');
  res.json({ success: true, message: 'Post hidden' });
});

export const unhidePost = asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE community_posts SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.postId]
  );
  if (!result.rows[0]) notFound('Post');
  res.json({ success: true, message: 'Post unhidden' });
});

export const hideComment = asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE comments SET status = 'hidden', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.commentId]
  );
  if (!result.rows[0]) notFound('Comment');
  res.json({ success: true, message: 'Comment hidden' });
});

export const unhideComment = asyncHandler(async (req, res) => {
  const result = await query(
    `UPDATE comments SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.commentId]
  );
  if (!result.rows[0]) notFound('Comment');
  res.json({ success: true, message: 'Comment unhidden' });
});