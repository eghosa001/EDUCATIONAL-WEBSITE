import { query } from '../../common/database/index.js';

export const analyticsService = {
  async getPlatformMetrics(dateRange = '30d') {
    const days = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : 30;
    const result = await query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '${days} days') as new_users,
        (SELECT COUNT(*) FROM exam_attempts WHERE started_at > NOW() - INTERVAL '${days} days') as exams_taken,
        (SELECT COUNT(*) FROM student_courses WHERE enrolled_at > NOW() - INTERVAL '${days} days') as enrollments,
        (SELECT COUNT(*) FROM payments WHERE paid_at IS NOT NULL AND created_at > NOW() - INTERVAL '${days} days') as transactions,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed' AND created_at > NOW() - INTERVAL '${days} days') as revenue
      `
    );
    return result.rows[0];
  },

  async getRevenueBreakdown(period = 'monthly') {
    const result = await query(`
      SELECT DATE_TRUNC($1, paid_at) as period,
             COUNT(*)::int as transaction_count,
             COALESCE(SUM(amount), 0) as total_revenue
      FROM payments
      WHERE status = 'completed' AND paid_at IS NOT NULL
      GROUP BY period ORDER BY period DESC LIMIT 12
    `, [period]);
    return result.rows;
  },

  async getCoursesPerformance() {
    const result = await query(`
      SELECT c.id, c.title, c.slug,
             COUNT(DISTINCT sc.student_id) as enrollment_count,
             AVG(sc.progress_percentage) as avg_progress,
             COUNT(DISTINCT CASE WHEN sc.completed_at IS NOT NULL THEN sc.student_id END) as completed_count
      FROM courses c
      LEFT JOIN student_courses sc ON c.id = sc.course_id
      GROUP BY c.id ORDER BY enrollment_count DESC LIMIT 10
    `);
    return result.rows;
  },

  async getUserEngagement(days = 7) {
    const result = await query(`
      SELECT DATE(s.started_at)::date as day, COUNT(DISTINCT s.student_id) as active_users
      FROM study_sessions s
      WHERE s.started_at > NOW() - INTERVAL '${days} days'
      GROUP BY day ORDER BY day DESC
    `);
    return result.rows;
  },
};

export default analyticsService;
