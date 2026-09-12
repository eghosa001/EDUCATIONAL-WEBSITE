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
const isoDay = (value: unknown) => String(value || '').slice(0, 10);
const successfulPaymentStatuses = ['success', 'successful', 'completed'];

const calculateStreaks = (days: string[]) => {
  const unique = [...new Set(days.filter(Boolean))].sort();
  if (!unique.length) return { currentStreak: 0, longestStreak: 0 };
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const previous = new Date(`${unique[i - 1]}T00:00:00Z`);
    const current = new Date(`${unique[i]}T00:00:00Z`);
    if ((current.getTime() - previous.getTime()) / 86400000 === 1) run += 1;
    else run = 1;
    longestStreak = Math.max(longestStreak, run);
  }
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const yesterday = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
  const end = unique[unique.length - 1];
  if (end !== todayKey && end !== yesterday) return { currentStreak: 0, longestStreak };
  let currentStreak = 1;
  for (let i = unique.length - 1; i > 0; i -= 1) {
    const a = new Date(`${unique[i]}T00:00:00Z`);
    const b = new Date(`${unique[i - 1]}T00:00:00Z`);
    if ((a.getTime() - b.getTime()) / 86400000 !== 1) break;
    currentStreak += 1;
  }
  return { currentStreak, longestStreak };
};

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
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return out({ error: 'Authentication required' }, 401);

    const { data: roleRows } = await admin.from('user_roles').select('roles(name)').eq('user_id', user.id);
    const roleNames = (roleRows || []).map((row: any) => row.roles?.name).filter(Boolean);
    const isAdmin = roleNames.includes('super_admin');

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return out({ error: 'Invalid request body' }, 400);
    const action = String((body as any).action || '');
    const adminOnlyActions = new Set(['platform', 'revenue', 'content', 'export', 'time-series']);
    if (adminOnlyActions.has(action) && !isAdmin) return out({ error: 'Administrator access required' }, 403);

    const count = async (table: string, filter?: [string, string | boolean]) => {
      let query = admin.from(table).select('*', { count: 'exact', head: true });
      if (filter) query = query.eq(filter[0], filter[1]);
      const result = await query;
      if (result.error) throw new Error(`Unable to read ${table}`);
      return result.count || 0;
    };

    if (action === 'user') {
      const [{ data: studySessions }, { data: enrollments }, { data: lessonRows }, { data: attempts }] = await Promise.all([
        admin.from('study_sessions').select('duration_seconds,started_at').eq('student_id', user.id),
        admin.from('student_courses').select('completed_at,progress_percentage').eq('student_id', user.id),
        admin.from('lesson_progress').select('status,completed_at').eq('student_id', user.id),
        admin.from('exam_attempts').select('percentage').eq('student_id', user.id),
      ]);
      const studyDays = (studySessions || []).map((row: any) => isoDay(row.started_at)).filter(Boolean);
      const { currentStreak, longestStreak } = calculateStreaks(studyDays);
      const totalStudyTime = (studySessions || []).reduce((sum: number, row: any) => sum + Number(row.duration_seconds || 0), 0);
      const gradedAttempts = (attempts || []).filter((row: any) => row.percentage !== null && row.percentage !== undefined);
      const averageExamScore = gradedAttempts.length ? gradedAttempts.reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0) / gradedAttempts.length : 0;
      return out({ analytics: {
        totalSessions: (studySessions || []).length,
        totalStudyTime,
        coursesEnrolled: (enrollments || []).length,
        coursesCompleted: (enrollments || []).filter((row: any) => row.completed_at || Number(row.progress_percentage || 0) >= 100).length,
        lessonsCompleted: (lessonRows || []).filter((row: any) => row.status === 'completed' || row.completed_at).length,
        examsTaken: (attempts || []).length,
        averageExamScore,
        activeDays: new Set(studyDays).size,
        currentStreak,
        longestStreak,
      } });
    }

    if (action === 'course') {
      const courseId = (body as any).courseId;
      if (!uuid(courseId)) return out({ error: 'Valid courseId is required' }, 400);
      const [{ data: enrollments, error: enrollmentError }, { data: course, error: courseError }, { data: progress, error: progressError }, { data: lessons, error: lessonsError }] = await Promise.all([
        admin.from('student_courses').select('progress_percentage,completed_at').eq('course_id', courseId),
        admin.from('courses').select('lesson_count,rating,review_count').eq('id', courseId).maybeSingle(),
        admin.from('lesson_progress').select('lesson_id,status,completed_at').eq('course_id', courseId),
        admin.from('lessons').select('id,title,view_count').eq('course_id', courseId).eq('is_published', true),
      ]);
      if (enrollmentError || courseError || progressError || lessonsError) return out({ error: 'Unable to load course analytics' }, 500);
      const enrollmentCount = enrollments?.length || 0;
      const averageProgress = enrollmentCount ? (enrollments || []).reduce((sum: number, row: any) => sum + Number(row.progress_percentage || 0), 0) / enrollmentCount : 0;
      const popularLessons = [...(lessons || [])]
        .sort((a: any, b: any) => Number(b.view_count || 0) - Number(a.view_count || 0))
        .slice(0, 10)
        .map((row: any) => ({ lessonId: row.id, title: row.title, viewCount: Number(row.view_count || 0) }));
      return out({ analytics: {
        enrollmentCount,
        completionRate: enrollmentCount ? ((enrollments || []).filter((row: any) => row.completed_at || Number(row.progress_percentage || 0) >= 100).length / enrollmentCount) * 100 : 0,
        averageProgress,
        totalLessons: Number(course?.lesson_count || lessons?.length || 0),
        completedLessons: (progress || []).filter((row: any) => row.status === 'completed' || row.completed_at).length,
        averageRating: Number(course?.rating || 0),
        reviewCount: Number(course?.review_count || 0),
        popularLessons,
      } });
    }

    if (action === 'exam') {
      const examId = (body as any).examId;
      if (!uuid(examId)) return out({ error: 'Valid examId is required' }, 400);
      const [{ data: attempts, error: attemptError }, { data: links, error: linkError }] = await Promise.all([
        admin.from('exam_attempts').select('id,percentage,is_passed').eq('exam_id', examId),
        admin.from('exam_questions').select('question_id').eq('exam_id', examId),
      ]);
      if (attemptError || linkError) return out({ error: 'Unable to load exam analytics' }, 500);
      const questionIds = [...new Set((links || []).map((row: any) => row.question_id).filter(Boolean))];
      const attemptIds = (attempts || []).map((row: any) => row.id);
      const [{ data: questions }, { data: answers }] = await Promise.all([
        questionIds.length ? admin.from('questions').select('id,difficulty').in('id', questionIds) : Promise.resolve({ data: [] as any[] }),
        attemptIds.length ? admin.from('exam_answers').select('question_id,is_correct').in('attempt_id', attemptIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const difficultyDistribution: Record<string, number> = {};
      for (const row of questions || []) {
        const key = String((row as any).difficulty || 'unknown');
        difficultyDistribution[key] = (difficultyDistribution[key] || 0) + 1;
      }
      const performance = new Map<string, { correctCount: number; incorrectCount: number }>();
      for (const row of answers || []) {
        const key = String((row as any).question_id);
        const item = performance.get(key) || { correctCount: 0, incorrectCount: 0 };
        if ((row as any).is_correct) item.correctCount += 1; else item.incorrectCount += 1;
        performance.set(key, item);
      }
      const totalAttempts = attempts?.length || 0;
      const graded = (attempts || []).filter((row: any) => row.percentage !== null && row.percentage !== undefined);
      const averageScore = graded.length ? graded.reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0) / graded.length : 0;
      const passRate = totalAttempts ? ((attempts || []).filter((row: any) => row.is_passed).length / totalAttempts) * 100 : 0;
      return out({ analytics: {
        totalAttempts,
        averageScore,
        passRate,
        difficultyDistribution,
        questionPerformance: [...performance.entries()].map(([questionId, value]) => ({ questionId, ...value })),
      } });
    }

    if (action === 'platform') {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000).toISOString();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
      const [users, courses, lessons, questions, exams, subscriptions, enrollmentCount] = await Promise.all([
        count('users'), count('courses'), count('lessons'), count('questions'), count('exams'), count('subscriptions'), count('student_courses'),
      ]);
      const [{ count: activeUsers }, { count: recentUsers }, { count: previousUsers }, { data: enrollments }, { data: payments }] = await Promise.all([
        admin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true).gte('last_login_at', thirtyDaysAgo),
        admin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgo),
        admin.from('users').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgo).lt('created_at', thirtyDaysAgo),
        admin.from('student_courses').select('completed_at,progress_percentage'),
        admin.from('payments').select('amount,status,paid_at').in('status', successfulPaymentStatuses).gte('paid_at', monthStart),
      ]);
      const monthlyRevenue = (payments || []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
      const completed = (enrollments || []).filter((row: any) => row.completed_at || Number(row.progress_percentage || 0) >= 100).length;
      const previous = Number(previousUsers || 0);
      const userGrowth = previous ? ((Number(recentUsers || 0) - previous) / previous) * 100 : Number(recentUsers || 0) > 0 ? 100 : 0;
      return out({ stats: {
        totalUsers: users,
        activeUsers: Number(activeUsers || 0),
        totalCourses: courses,
        totalLessons: lessons,
        totalQuestions: questions,
        totalExams: exams,
        totalSubscriptions: subscriptions,
        monthlyRevenue,
        userGrowth,
        courseCompletionRate: enrollmentCount ? (completed / enrollmentCount) * 100 : 0,
      } });
    }

    if (action === 'revenue') {
      const [{ data: payments, error: paymentError }, { data: subscriptions, error: subscriptionError }, { data: plans, error: planError }] = await Promise.all([
        admin.from('payments').select('amount,paid_at,status,gateway,purpose,purpose_id').in('status', successfulPaymentStatuses),
        admin.from('subscriptions').select('plan_id,status,canceled_at'),
        admin.from('subscription_plans').select('id,name'),
      ]);
      if (paymentError || subscriptionError || planError) return out({ error: 'Unable to load revenue analytics' }, 500);
      const totalRevenue = (payments || []).reduce((sum: number, row: any) => sum + Number(row.amount || 0), 0);
      const monthly = new Map<string, number>();
      const revenueBySource: Record<string, number> = {};
      for (const row of payments || []) {
        const month = String((row as any).paid_at || '').slice(0, 7);
        if (month) monthly.set(month, (monthly.get(month) || 0) + Number((row as any).amount || 0));
        const source = String((row as any).gateway || (row as any).purpose || 'unknown');
        revenueBySource[source] = (revenueBySource[source] || 0) + Number((row as any).amount || 0);
      }
      const planNames = new Map((plans || []).map((p: any) => [p.id, p.name]));
      const subscriptionBreakdown: Record<string, { count: number; revenue: number }> = {};
      for (const row of subscriptions || []) {
        const key = String(planNames.get((row as any).plan_id) || 'Unknown plan');
        subscriptionBreakdown[key] ||= { count: 0, revenue: 0 };
        subscriptionBreakdown[key].count += 1;
      }
      for (const payment of payments || []) {
        if ((payment as any).purpose !== 'subscription') continue;
        const subscription = (subscriptions || []).find((s: any) => s.id === (payment as any).purpose_id);
        const key = String(planNames.get(subscription?.plan_id) || 'Unknown plan');
        subscriptionBreakdown[key] ||= { count: 0, revenue: 0 };
        subscriptionBreakdown[key].revenue += Number((payment as any).amount || 0);
      }
      const activeSubscriptions = (subscriptions || []).filter((row: any) => ['active', 'trialing'].includes(String(row.status))).length;
      const canceledSubscriptions = (subscriptions || []).filter((row: any) => row.canceled_at || row.status === 'canceled').length;
      const churnRate = subscriptions?.length ? (canceledSubscriptions / subscriptions.length) * 100 : 0;
      return out({ analytics: {
        totalRevenue,
        monthlyRevenue: [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, revenue]) => ({ month, revenue })),
        revenueBySource,
        subscriptionBreakdown,
        activeSubscriptions,
        churnRate,
      } });
    }

    if (action === 'content') {
      const [{ data: courses }, { data: lessons }, { data: attempts }, { data: exams }] = await Promise.all([
        admin.from('courses').select('id,title,rating,enrollment_count'),
        admin.from('lessons').select('id,course_id,title,view_count').eq('is_published', true),
        admin.from('exam_attempts').select('exam_id'),
        admin.from('exams').select('id,title'),
      ]);
      const courseViews = new Map<string, number>();
      for (const row of lessons || []) courseViews.set((row as any).course_id, (courseViews.get((row as any).course_id) || 0) + Number((row as any).view_count || 0));
      const mostViewedCourses = [...(courses || [])]
        .map((row: any) => ({ courseId: row.id, title: row.title, viewCount: courseViews.get(row.id) || Number(row.enrollment_count || 0) }))
        .sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
      const mostPopularLessons = [...(lessons || [])]
        .map((row: any) => ({ lessonId: row.id, title: row.title, viewCount: Number(row.view_count || 0) }))
        .sort((a, b) => b.viewCount - a.viewCount).slice(0, 10);
      const highestRatedCourses = [...(courses || [])]
        .map((row: any) => ({ courseId: row.id, title: row.title, rating: Number(row.rating || 0) }))
        .sort((a, b) => b.rating - a.rating).slice(0, 10);
      const examCounts = new Map<string, number>();
      for (const row of attempts || []) examCounts.set((row as any).exam_id, (examCounts.get((row as any).exam_id) || 0) + 1);
      const mostAttemptedExams = [...(exams || [])]
        .map((row: any) => ({ examId: row.id, title: row.title, attemptCount: examCounts.get(row.id) || 0 }))
        .sort((a, b) => b.attemptCount - a.attemptCount).slice(0, 10);
      return out({ analytics: { mostViewedCourses, mostPopularLessons, highestRatedCourses, mostAttemptedExams } });
    }

    if (action === 'learning') {
      const [{ data: sessions }, { data: lessonProgress }, { data: attempts }] = await Promise.all([
        admin.from('study_sessions').select('course_id,lesson_id,duration_seconds,started_at').eq('student_id', user.id),
        admin.from('lesson_progress').select('lesson_id,completed_at,status').eq('student_id', user.id),
        admin.from('exam_attempts').select('id').eq('student_id', user.id),
      ]);
      const courseIds = [...new Set((sessions || []).map((s: any) => s.course_id).filter(Boolean))];
      const lessonIds = [...new Set((sessions || []).map((s: any) => s.lesson_id).filter(Boolean))];
      const attemptIds = (attempts || []).map((a: any) => a.id);
      const [{ data: courses }, { data: lessons }, { data: answers }] = await Promise.all([
        courseIds.length ? admin.from('courses').select('id,subject_id').in('id', courseIds) : Promise.resolve({ data: [] as any[] }),
        lessonIds.length ? admin.from('lessons').select('id,topic_id').in('id', lessonIds) : Promise.resolve({ data: [] as any[] }),
        attemptIds.length ? admin.from('exam_answers').select('question_id,is_correct').in('attempt_id', attemptIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const questionIds = [...new Set((answers || []).map((a: any) => a.question_id).filter(Boolean))];
      const { data: questions } = questionIds.length ? await admin.from('questions').select('id,subject_id,topic_id').in('id', questionIds) : { data: [] as any[] };
      const subjectIds = [...new Set([...(courses || []).map((c: any) => c.subject_id), ...(questions || []).map((q: any) => q.subject_id)].filter(Boolean))];
      const topicIds = [...new Set([...(lessons || []).map((l: any) => l.topic_id), ...(questions || []).map((q: any) => q.topic_id)].filter(Boolean))];
      const [{ data: subjects }, { data: topics }] = await Promise.all([
        subjectIds.length ? admin.from('subjects').select('id,name').in('id', subjectIds) : Promise.resolve({ data: [] as any[] }),
        topicIds.length ? admin.from('topics').select('id,name').in('id', topicIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const subjectNames = new Map((subjects || []).map((s: any) => [s.id, s.name]));
      const topicNames = new Map((topics || []).map((t: any) => [t.id, t.name]));
      const courseSubject = new Map((courses || []).map((c: any) => [c.id, c.subject_id]));
      const lessonTopic = new Map((lessons || []).map((l: any) => [l.id, l.topic_id]));
      const questionMap = new Map((questions || []).map((q: any) => [q.id, q]));
      const timeSpentBySubject: Record<string, number> = {};
      const topicTime = new Map<string, number>();
      const activityByDay: Record<string, { date: string; studyTime: number; lessonsCompleted: number }> = {};
      for (const row of sessions || []) {
        const subjectId = courseSubject.get((row as any).course_id);
        const subjectName = String(subjectNames.get(subjectId) || 'Other');
        timeSpentBySubject[subjectName] = (timeSpentBySubject[subjectName] || 0) + Number((row as any).duration_seconds || 0);
        const topicId = lessonTopic.get((row as any).lesson_id);
        if (topicId) topicTime.set(topicId, (topicTime.get(topicId) || 0) + Number((row as any).duration_seconds || 0));
        const day = isoDay((row as any).started_at);
        if (day) {
          activityByDay[day] ||= { date: day, studyTime: 0, lessonsCompleted: 0 };
          activityByDay[day].studyTime += Number((row as any).duration_seconds || 0);
        }
      }
      for (const row of lessonProgress || []) {
        if (!(row as any).completed_at && (row as any).status !== 'completed') continue;
        const day = isoDay((row as any).completed_at);
        if (!day) continue;
        activityByDay[day] ||= { date: day, studyTime: 0, lessonsCompleted: 0 };
        activityByDay[day].lessonsCompleted += 1;
      }
      const subjectScores = new Map<string, { correct: number; total: number }>();
      const topicScores = new Map<string, { correct: number; total: number }>();
      for (const row of answers || []) {
        const question = questionMap.get((row as any).question_id);
        if (!question) continue;
        if (question.subject_id) {
          const key = String(subjectNames.get(question.subject_id) || question.subject_id);
          const score = subjectScores.get(key) || { correct: 0, total: 0 };
          score.total += 1; if ((row as any).is_correct) score.correct += 1; subjectScores.set(key, score);
        }
        if (question.topic_id) {
          const score = topicScores.get(question.topic_id) || { correct: 0, total: 0 };
          score.total += 1; if ((row as any).is_correct) score.correct += 1; topicScores.set(question.topic_id, score);
        }
      }
      const performanceBySubject: Record<string, { averageScore: number; completionRate: number }> = {};
      for (const [name, score] of subjectScores) performanceBySubject[name] = { averageScore: score.total ? (score.correct / score.total) * 100 : 0, completionRate: 0 };
      const popularTopics = [...topicTime.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([topicId, timeSpent]) => ({ topicId, topicName: String(topicNames.get(topicId) || 'Topic'), timeSpent }));
      const weakAreas = [...topicScores.entries()].map(([topicId, score]) => ({ topicId, topicName: String(topicNames.get(topicId) || 'Topic'), averageScore: score.total ? (score.correct / score.total) * 100 : 0 })).sort((a, b) => a.averageScore - b.averageScore).slice(0, 10);
      return out({ analytics: { timeSpentBySubject, performanceBySubject, activityByDay, popularTopics, weakAreas } });
    }

    if (action === 'time-series') {
      const start = new Date(String((body as any).startDate || new Date(Date.now() - 30 * 86400000).toISOString()));
      const end = new Date(String((body as any).endDate || new Date().toISOString()));
      if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end || end.getTime() - start.getTime() > 366 * 86400000) return out({ error: 'Invalid date range' }, 400);
      const startIso = start.toISOString();
      const endIso = end.toISOString();
      const [{ data: users }, { data: enrollments }, { data: attempts }, { data: payments }, { data: sessions }] = await Promise.all([
        admin.from('users').select('created_at').gte('created_at', startIso).lte('created_at', endIso),
        admin.from('student_courses').select('enrolled_at').gte('enrolled_at', startIso).lte('enrolled_at', endIso),
        admin.from('exam_attempts').select('started_at').gte('started_at', startIso).lte('started_at', endIso),
        admin.from('payments').select('amount,paid_at,status').in('status', successfulPaymentStatuses).gte('paid_at', startIso).lte('paid_at', endIso),
        admin.from('study_sessions').select('student_id,started_at').gte('started_at', startIso).lte('started_at', endIso),
      ]);
      const series = new Map<string, { userSignups: number; courseEnrollments: number; examAttempts: number; revenue: number; users: Set<string> }>();
      for (let day = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
        series.set(day.toISOString().slice(0, 10), { userSignups: 0, courseEnrollments: 0, examAttempts: 0, revenue: 0, users: new Set() });
      }
      for (const row of users || []) { const d = series.get(isoDay((row as any).created_at)); if (d) d.userSignups += 1; }
      for (const row of enrollments || []) { const d = series.get(isoDay((row as any).enrolled_at)); if (d) d.courseEnrollments += 1; }
      for (const row of attempts || []) { const d = series.get(isoDay((row as any).started_at)); if (d) d.examAttempts += 1; }
      for (const row of payments || []) { const d = series.get(isoDay((row as any).paid_at)); if (d) d.revenue += Number((row as any).amount || 0); }
      for (const row of sessions || []) { const d = series.get(isoDay((row as any).started_at)); if (d) d.users.add(String((row as any).student_id)); }
      const entries = [...series.entries()];
      return out({ analytics: {
        userSignups: entries.map(([date, value]) => ({ date, value: value.userSignups })),
        courseEnrollments: entries.map(([date, value]) => ({ date, value: value.courseEnrollments })),
        examAttempts: entries.map(([date, value]) => ({ date, value: value.examAttempts })),
        revenue: entries.map(([date, value]) => ({ date, value: value.revenue })),
        activeUsers: entries.map(([date, value]) => ({ date, value: value.users.size })),
      } });
    }

    if (action === 'export') return out({ error: 'Analytics export is not enabled yet; use the analytics datasets directly.' }, 501);
    return out({ error: 'Unsupported analytics action' }, 400);
  } catch (error) {
    console.error('Analytics operation failed:', error instanceof Error ? error.message : 'unknown error');
    return out({ error: 'Analytics operation failed' }, 500);
  }
});