import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const out = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...cors, 'Content-Type': 'application/json' },
});
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return out({ error: 'Method not allowed' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const auth = req.headers.get('Authorization');
    if (!url || !anon || !service) return out({ error: 'Analytics configuration is incomplete' }, 500);
    if (!auth?.startsWith('Bearer ')) return out({ error: 'Authentication required' }, 401);

    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const admin = createClient(url, service);
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return out({ error: 'Authentication required' }, 401);

    const { data: roleRows } = await admin.from('user_roles').select('roles(name)').eq('user_id', user.id);
    const roleNames = (roleRows || []).map((row: any) => row.roles?.name).filter(Boolean);
    const isAdmin = roleNames.includes('admin') || roleNames.includes('super_admin');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return out({ error: 'Invalid request body' }, 400);
    const action = String(body.action || '');
    const adminOnlyActions = new Set(['platform', 'revenue', 'content', 'export', 'time-series']);
    if (adminOnlyActions.has(action) && !isAdmin) return out({ error: 'Administrator access required' }, 403);

    const count = async (table: string, filter?: [string, string]) => {
      let query = admin.from(table).select('*', { count: 'exact', head: true });
      if (filter) query = query.eq(filter[0], filter[1]);
      const result = await query;
      if (result.error) throw new Error(`Unable to read ${table}`);
      return result.count || 0;
    };

    if (action === 'user') {
      const [sessions, study, courses, lessons, exams] = await Promise.all([
        count('sessions', ['user_id', user.id]),
        count('study_sessions', ['student_id', user.id]),
        count('student_courses', ['student_id', user.id]),
        count('lesson_progress', ['student_id', user.id]),
        count('exam_attempts', ['student_id', user.id]),
      ]);
      const { data: attempts } = await admin.from('exam_attempts').select('percentage').eq('student_id', user.id).not('percentage', 'is', null);
      const averageExamScore = attempts?.length ? attempts.reduce((sum, row) => sum + Number(row.percentage || 0), 0) / attempts.length : 0;
      const { data: studySessions } = await admin.from('study_sessions').select('duration_seconds,started_at').eq('student_id', user.id);
      const activeDays = new Set((studySessions || []).map((row) => String(row.started_at).slice(0, 10))).size;
      const totalStudyTime = (studySessions || []).reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0);
      return out({ analytics: { totalSessions: sessions, totalStudyTime, coursesEnrolled: courses, coursesCompleted: 0, lessonsCompleted: lessons, examsTaken: exams, averageExamScore, activeDays, currentStreak: 0, longestStreak: 0 } });
    }

    if (action === 'course') {
      if (!uuid(body.courseId)) return out({ error: 'Valid courseId is required' }, 400);
      const [{ data: enrollments, error: enrollmentError }, { data: course, error: courseError }, { data: progress, error: progressError }] = await Promise.all([
        admin.from('student_courses').select('progress_percentage').eq('course_id', body.courseId),
        admin.from('courses').select('lesson_count,rating,review_count').eq('id', body.courseId).maybeSingle(),
        admin.from('lesson_progress').select('lesson_id,status').eq('course_id', body.courseId),
      ]);
      if (enrollmentError || courseError || progressError) return out({ error: 'Unable to load course analytics' }, 500);
      const enrollmentCount = enrollments?.length || 0;
      const averageProgress = enrollmentCount ? (enrollments || []).reduce((sum, row) => sum + Number(row.progress_percentage || 0), 0) / enrollmentCount : 0;
      return out({ analytics: { enrollmentCount, completionRate: enrollmentCount ? ((enrollments || []).filter((row) => Number(row.progress_percentage || 0) >= 100).length / enrollmentCount) * 100 : 0, averageProgress, totalLessons: Number(course?.lesson_count || progress?.length || 0), completedLessons: (progress || []).filter((row) => row.status === 'completed').length, averageRating: Number(course?.rating || 0), reviewCount: Number(course?.review_count || 0), popularLessons: [] } });
    }

    if (action === 'exam') {
      if (!uuid(body.examId)) return out({ error: 'Valid examId is required' }, 400);
      const { data: attempts, error } = await admin.from('exam_attempts').select('percentage,is_passed').eq('exam_id', body.examId);
      if (error) return out({ error: 'Unable to load exam analytics' }, 500);
      const totalAttempts = attempts?.length || 0;
      const averageScore = totalAttempts ? (attempts || []).reduce((sum, row) => sum + Number(row.percentage || 0), 0) / totalAttempts : 0;
      const passRate = totalAttempts ? ((attempts || []).filter((row) => row.is_passed).length / totalAttempts) * 100 : 0;
      return out({ analytics: { totalAttempts, averageScore, passRate, difficultyDistribution: {}, questionPerformance: [] } });
    }

    if (action === 'platform' || action === 'revenue') {
      const [users, courses, lessons, questions, exams, subscriptions] = await Promise.all([
        count('users'), count('courses'), count('lessons'), count('questions'), count('exams'), count('subscriptions'),
      ]);
      if (action === 'platform') return out({ stats: { totalUsers: users, activeUsers: 0, totalCourses: courses, totalLessons: lessons, totalQuestions: questions, totalExams: exams, totalSubscriptions: subscriptions, monthlyRevenue: 0, userGrowth: 0, courseCompletionRate: 0 } });
      const { data: payments, error } = await admin.from('payments').select('amount,paid_at,status').eq('status', 'success');
      if (error) return out({ error: 'Unable to load revenue analytics' }, 500);
      const totalRevenue = (payments || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
      return out({ analytics: { totalRevenue, monthlyRevenue: [], revenueBySource: {}, subscriptionBreakdown: {}, activeSubscriptions: subscriptions, churnRate: 0 } });
    }

    if (action === 'content') return out({ analytics: { mostViewedCourses: [], mostPopularLessons: [], highestRatedCourses: [], mostAttemptedExams: [] } });
    if (action === 'learning') return out({ analytics: { timeSpentBySubject: {}, performanceBySubject: {}, activityByDay: {}, popularTopics: [], weakAreas: [] } });
    if (action === 'time-series') {
      const start = new Date(String(body.startDate || new Date(Date.now() - 30 * 86400000).toISOString()));
      const end = new Date(String(body.endDate || new Date().toISOString()));
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end || end.getTime() - start.getTime() > 366 * 86400000) return out({ error: 'Invalid date range' }, 400);
      const days: Array<{ date: string; value: number }> = [];
      for (let day = new Date(start); day <= end; day.setUTCDate(day.getUTCDate() + 1)) days.push({ date: day.toISOString().slice(0, 10), value: 0 });
      return out({ analytics: { userSignups: days, courseEnrollments: days, examAttempts: days, revenue: days, activeUsers: days } });
    }
    if (action === 'export') return out({ error: 'Analytics export is not enabled yet; use the analytics datasets directly.' }, 501);
    return out({ error: 'Unsupported analytics action' }, 400);
  } catch (error) {
    console.error('Analytics operation failed:', error instanceof Error ? error.message : 'unknown error');
    return out({ error: 'Analytics operation failed' }, 500);
  }
});