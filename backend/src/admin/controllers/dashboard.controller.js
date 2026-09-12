import { query } from '../../common/database/index.js';

export const getDashboard = async (_req, res) => {
  const result = await query(
    `SELECT
       (SELECT COUNT(DISTINCT ur.user_id)::int FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'student') AS total_students,
       (SELECT COUNT(DISTINCT ur.user_id)::int FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'teacher') AS total_teachers,
       (SELECT COUNT(DISTINCT ur.user_id)::int FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.name = 'parent') AS total_parents,
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
    `SELECT u.id, u.email, u.first_name, u.last_name, u.created_at,
            COALESCE(array_agg(r.name ORDER BY r.name) FILTER (WHERE r.name IS NOT NULL), ARRAY[]::varchar[]) AS roles
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT 5`
  );

  const popularSubjects = await query(
    `SELECT s.name, s.code, COUNT(sc.id)::int AS enrollments
       FROM subjects s
       JOIN courses c ON c.subject_id = s.id
       JOIN student_courses sc ON sc.course_id = c.id
      GROUP BY s.id, s.name, s.code
      ORDER BY enrollments DESC
      LIMIT 5`
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
        totalStudents: Number(row.total_students || 0),
        totalTeachers: Number(row.total_teachers || 0),
        totalParents: Number(row.total_parents || 0),
        totalSchools: Number(row.total_schools || 0),
        activeToday: Number(row.active_today || 0),
        courses: Number(row.courses || 0),
        lessons: Number(row.lessons || 0),
        questions: Number(row.questions || 0),
        exams: Number(row.exams || 0),
        subscribers: Number(row.subscribers || 0),
        monthlyRevenue: Number(row.monthly_revenue || 0),
      },
      recentUsers: recentUsers.rows.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.roles[0] || 'student',
        roles: user.roles,
        createdAt: user.created_at,
      })),
      popularSubjects: popularSubjects.rows.map((subject) => ({
        name: subject.name,
        code: subject.code,
        enrollments: subject.enrollments,
      })),
      pendingContent: {
        coursesPendingReview: Number(pendingContent.rows[0]?.courses_pending || 0),
        lessonsUnpublished: Number(pendingContent.rows[0]?.lessons_unpublished || 0),
      },
    },
  });
};

export default { getDashboard };
