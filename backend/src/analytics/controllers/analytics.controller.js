import { HTTP_STATUS, ERROR_CODES, AppError } from '../../index.js';
import { analyticsService } from '../services/analytics.service.js';
import { query } from '../../index.js';

export const getPlatformMetrics = async (req, res) => {
  const { range } = req.query;
  const metrics = await analyticsService.getPlatformMetrics(range || '30d');
  res.json({ success: true, data: { metrics } });
};

export const getRevenueBreakdown = async (req, res) => {
  const { period } = req.query;
  const breakdown = await analyticsService.getRevenueBreakdown(period || 'monthly');
  res.json({ success: true, data: { breakdown } });
};

export const getCoursesPerformance = async (req, res) => {
  const performance = await analyticsService.getCoursesPerformance();
  res.json({ success: true, data: { courses: performance } });
};

export const getUserEngagement = async (req, res) => {
  const { days } = req.query;
  const engagement = await analyticsService.getUserEngagement(parseInt(days) || 7);
  res.json({ success: true, data: { engagement } });
};

export const getAdminDashboard = async (req, res) => {
  const [metrics, revenue, courses, engagement] = await Promise.all([
    analyticsService.getPlatformMetrics('30d'),
    analyticsService.getRevenueBreakdown('monthly'),
    analyticsService.getCoursesPerformance(),
    analyticsService.getUserEngagement(7),
  ]);

  // Additional aggregates for the dashboard
  const [totalUsers, totalCourses, totalQuestions, totalExams] = await Promise.all([
    query('SELECT COUNT(*)::int FROM users'),
    query('SELECT COUNT(*)::int FROM courses WHERE status = \'published\''),
    query('SELECT COUNT(*)::int FROM questions'),
    query('SELECT COUNT(*)::int FROM exams WHERE is_published = true'),
  ]);

  const activeToday = await query(
    "SELECT COUNT(DISTINCT user_id)::int FROM study_sessions WHERE started_at > NOW() - INTERVAL '24 hours'"
  );

  const recentSubscriptions = await query(
    "SELECT COUNT(*)::int FROM subscriptions WHERE status = 'active' AND created_at > NOW() - INTERVAL '30 days'"
  );

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers: totalUsers.rows[0].count,
        activeToday: activeToday.rows[0].count,
        totalCourses: totalCourses.rows[0].count,
        totalQuestions: totalQuestions.rows[0].count,
        totalExams: totalExams.rows[0].count,
        subscribers: recentSubscriptions.rows[0].count,
        ...metrics,
      },
      revenue: revenue,
      topCourses: courses,
      engagementTrend: engagement,
    },
  });
};
