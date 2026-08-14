import { query } from '../../common/database/index.js';
import { AppError, HTTP_STATUS, ERROR_CODES } from '../../common/errors/index.js';
import { COURSE_STATUS } from '../../common/constants/index.js';

export const adminService = {
  async getDashboardStats() {
    const aggregateResult = await query(
      `SELECT
         (SELECT COUNT(DISTINCT u.id)::int
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
           WHERE r.name = 'student') AS total_students,
         (SELECT COUNT(DISTINCT u.id)::int
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
           WHERE r.name = 'teacher') AS total_teachers,
         (SELECT COUNT(DISTINCT u.id)::int
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
           WHERE r.name = 'parent') AS total_parents,
         (SELECT COUNT(*)::int FROM schools) AS total_schools,
         (SELECT COUNT(*)::int FROM users WHERE last_login_at >= NOW() - INTERVAL '24 hours') AS active_today,
         (SELECT COUNT(*)::int FROM courses) AS courses,
         (SELECT COUNT(*)::int FROM lessons) AS lessons,
         (SELECT COUNT(*)::int FROM questions) AS questions,
         (SELECT COUNT(*)::int FROM exams) AS exams,
         (SELECT COUNT(*)::int FROM subscriptions WHERE status = 'active') AS subscribers,
         (SELECT COALESCE(SUM(amount), 0)::numeric(14,2)
            FROM payments
           WHERE status = 'completed' AND created_at >= DATE_TRUNC('month', NOW())) AS monthly_revenue`
    );

    const [recentUsersResult, popularSubjectsResult, pendingContentResult] = await Promise.all([
      query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.avatar_url, u.is_active, u.created_at,
                COALESCE((
                  SELECT r.name
                    FROM user_roles ur
                    JOIN roles r ON r.id = ur.role_id
                   WHERE ur.user_id = u.id
                   ORDER BY ur.created_at ASC
                   LIMIT 1
                ), 'none') AS role
           FROM users u
          ORDER BY u.created_at DESC
          LIMIT 10`
      ),
      query(
        `SELECT s.id, s.name AS subject_name, s.code AS subject_code,
                COUNT(DISTINCT sc.student_id)::int AS students,
                COUNT(DISTINCT sc.course_id)::int AS courses
           FROM subjects s
           JOIN courses c ON c.subject_id = s.id
           JOIN student_courses sc ON sc.course_id = c.id
          GROUP BY s.id, s.name, s.code
          ORDER BY students DESC
          LIMIT 10`
      ),
      query(
        `SELECT
           (SELECT COUNT(*)::int FROM courses WHERE status IN ('draft', 'pending_review')) AS pending_courses,
           (SELECT COUNT(*)::int FROM lessons WHERE is_published = FALSE) AS unpublished_lessons`
      ),
    ]);

    const row = aggregateResult.rows[0] || {};
    return {
      totalStudents: parseInt(row.total_students || 0),
      totalTeachers: parseInt(row.total_teachers || 0),
      totalParents: parseInt(row.total_parents || 0),
      totalSchools: parseInt(row.total_schools || 0),
      activeToday: parseInt(row.active_today || 0),
      courses: parseInt(row.courses || 0),
      lessons: parseInt(row.lessons || 0),
      questions: parseInt(row.questions || 0),
      exams: parseInt(row.exams || 0),
      subscribers: parseInt(row.subscribers || 0),
      monthlyRevenue: parseFloat(row.monthly_revenue || 0),
      recentUsers: recentUsersResult.rows,
      popularSubjects: popularSubjectsResult.rows,
      pendingContent: pendingContentResult.rows[0] || {},
    };
  },

  async getPendingContent() {
    const [coursesResult, lessonsResult] = await Promise.all([
      query(
        `SELECT c.id, c.title, c.slug, c.status, c.difficulty, c.thumbnail_url,
                u.first_name, u.last_name, u.email AS teacher_email, c.created_at
           FROM courses c
           LEFT JOIN users u ON u.id = c.teacher_id
          WHERE c.status = 'pending_review'
          ORDER BY c.created_at DESC`
      ),
      query(
        `SELECT l.id, l.title, l.slug, l.content_type, l.course_id, l.is_published,
                c.title AS course_title, l.created_at
           FROM lessons l
           LEFT JOIN courses c ON c.id = l.course_id
          WHERE l.is_published = FALSE
          ORDER BY l.created_at DESC`
      ),
    ]);

    return {
      pendingCourses: coursesResult.rows,
      unpublishedLessons: lessonsResult.rows,
    };
  },

  async updateContentStatus(type, id, decision) {
    if (type === 'course') {
      const status = decision === 'approve' ? COURSE_STATUS.PUBLISHED : COURSE_STATUS.REJECTED;
      const result = await query(
        `UPDATE courses
            SET status = $2,
                published_at = CASE WHEN $2 = 'published' THEN COALESCE(published_at, NOW()) ELSE published_at END,
                updated_at = NOW()
          WHERE id = $1
        RETURNING *`,
        [id, status]
      );
      return result.rows[0] || null;
    }

    if (type === 'lesson') {
      const isPublished = decision === 'approve';
      const result = await query(
        `UPDATE lessons
            SET is_published = $2,
                updated_at = NOW()
          WHERE id = $1
        RETURNING *`,
        [id, isPublished]
      );
      return result.rows[0] || null;
    }

    throw new AppError('Unsupported content type', HTTP_STATUS.BAD_REQUEST, ERROR_CODES.VALIDATION_ERROR);
  },

  async listPostsForModeration({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT p.id, p.type, p.title, p.content, p.status, p.is_pinned, p.is_locked,
              p.views, p.likes_count, p.replies_count, p.created_at,
              u.first_name, u.last_name, u.email AS user_email
         FROM community_posts p
         LEFT JOIN users u ON u.id = p.user_id
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*)::int AS total FROM community_posts');

    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        total: countResult.rows[0].total,
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    };
  },

  async updatePostStatus(postId, status) {
    const result = await query(
      `UPDATE community_posts SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [postId, status]
    );
    return result.rows[0] || null;
  },

  async updateCommentStatus(commentId, status) {
    const result = await query(
      `UPDATE comments SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [commentId, status]
    );
    return result.rows[0] || null;
  },
};

export default adminService;
