import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (body: unknown, status = 200, origin = '*') => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Vary': 'Origin',
  },
});

const safeOrigin = (request: Request) => {
  const value = request.headers.get('origin');
  if (!value) return '*';
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : '*';
  } catch {
    return '*';
  }
};

const asInt = (value: string | null, fallback: number, min = 1, max = 100) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
};

const scalarAnswer = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of ['id', 'label', 'answer', 'value', 'correct_answer', 'correctAnswer']) {
      if (record[key] !== undefined && record[key] !== null) return scalarAnswer(record[key]);
    }
  }
  return '';
};

Deno.serve(async (request) => {
  const origin = safeOrigin(request);
  if (request.method === 'OPTIONS') return json({ ok: true }, 200, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return json({ error: { message: 'API configuration is incomplete' } }, 500, origin);

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const authorization = request.headers.get('Authorization') || '';
  let currentUser: { id: string; email?: string } | null = null;

  const requireUser = async () => {
    if (currentUser) return currentUser;
    if (!authorization.startsWith('Bearer ')) throw Object.assign(new Error('Authentication required'), { status: 401 });
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data, error } = await userClient.auth.getUser();
    if (error || !data.user) throw Object.assign(new Error('Authentication required'), { status: 401 });
    currentUser = { id: data.user.id, email: data.user.email };
    return currentUser;
  };

  try {
    const url = new URL(request.url);
    let path = url.pathname.replace(/^\/functions\/v1\/web-api/, '') || '/';
    if (path.startsWith('/api/v1')) path = path.slice('/api/v1'.length) || '/';

    // Public question-bank catalogue. Correct answers and explanations are never returned here.
    if (request.method === 'GET' && path === '/questions') {
      const page = asInt(url.searchParams.get('page'), 1, 1, 10000);
      const limit = asInt(url.searchParams.get('limit'), 20, 1, 100);
      const classId = url.searchParams.get('classId');
      const subjectId = url.searchParams.get('subjectId');
      const from = (page - 1) * limit;
      let query = admin
        .from('questions')
        .select('id,subject_id,topic_id,class_id,question_type,question_text,question_image_url,options,difficulty,marks,source,exam_year,exam_name,tags', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, from + limit - 1);
      if (classId) query = query.eq('class_id', classId);
      if (subjectId) query = query.eq('subject_id', subjectId);
      const { data, error, count } = await query;
      if (error) throw error;
      const questions = (data || []).map((row: any) => ({
        id: row.id,
        subjectId: row.subject_id,
        topicId: row.topic_id,
        classId: row.class_id,
        questionType: row.question_type,
        questionText: row.question_text,
        questionImageUrl: row.question_image_url,
        options: row.options,
        difficulty: row.difficulty,
        marks: row.marks,
        source: row.source,
        examYear: row.exam_year,
        examName: row.exam_name,
        tags: row.tags,
      }));
      const total = count || 0;
      return json({ data: { questions }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 200, origin);
    }

    if (request.method === 'GET' && path === '/past-questions') {
      const page = asInt(url.searchParams.get('page'), 1, 1, 10000);
      const limit = asInt(url.searchParams.get('limit'), 20, 1, 100);
      const board = url.searchParams.get('board');
      const subjectId = url.searchParams.get('subjectId');
      const year = url.searchParams.get('year');
      const from = (page - 1) * limit;
      let query = admin
        .from('past_questions')
        .select('id,board,year,subject_id,topic_id,question_type,question_text,question_image_url,options,difficulty,marks,source,tags', { count: 'exact' })
        .eq('is_active', true)
        .order('year', { ascending: false })
        .range(from, from + limit - 1);
      if (board) query = query.ilike('board', board);
      if (subjectId) query = query.eq('subject_id', subjectId);
      if (year) query = query.eq('year', Number(year));
      const { data, error, count } = await query;
      if (error) throw error;
      const total = count || 0;
      return json({ data: { questions: data || [] }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 200, origin);
    }

    const questionCheck = path.match(/^\/(questions|past-questions)\/([0-9a-f-]+)\/check$/i);
    if (request.method === 'POST' && questionCheck) {
      await requireUser();
      const payload = await request.json().catch(() => ({}));
      const submitted = scalarAnswer(payload?.answer);
      if (!submitted) return json({ error: { message: 'Answer is required' } }, 400, origin);
      const table = questionCheck[1] === 'past-questions' ? 'past_questions' : 'questions';
      const columns = table === 'past_questions'
        ? 'id,correct_answer,explanation,is_active'
        : 'id,correct_answer,explanation,explanation_image_url,is_active';
      const { data: row, error } = await admin.from(table).select(columns).eq('id', questionCheck[2]).eq('is_active', true).maybeSingle();
      if (error || !row) return json({ error: { message: 'Question not found' } }, 404, origin);
      const correctAnswer = scalarAnswer((row as any).correct_answer);
      const isCorrect = submitted.toLowerCase() === correctAnswer.toLowerCase();
      return json({ data: { result: {
        isCorrect,
        correctAnswer,
        explanation: (row as any).explanation || null,
        explanationImageUrl: (row as any).explanation_image_url || null,
      } } }, 200, origin);
    }

    if (request.method === 'GET' && path === '/progress/lessons') {
      const user = await requireUser();
      const limit = asInt(url.searchParams.get('limit'), 20, 1, 100);
      const { data, error } = await admin
        .from('lesson_progress')
        .select('id,lesson_id,course_id,status,progress_percentage,completed_at,updated_at,lesson:lessons(id,title,slug)')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return json({ data: data || [] }, 200, origin);
    }

    const completeCourseLesson = path.match(/^\/progress\/courses\/([0-9a-f-]+)\/lessons\/([0-9a-f-]+)\/complete$/i);
    const completeLesson = path.match(/^\/lessons\/([0-9a-f-]+)\/complete$/i);
    if (request.method === 'POST' && (completeCourseLesson || completeLesson)) {
      const user = await requireUser();
      const lessonId = completeCourseLesson ? completeCourseLesson[2] : completeLesson![1];
      let courseId = completeCourseLesson ? completeCourseLesson[1] : null;
      if (!courseId) {
        const { data: lesson, error } = await admin.from('lessons').select('id,course_id,is_published').eq('id', lessonId).eq('is_published', true).maybeSingle();
        if (error || !lesson?.course_id) return json({ error: { message: 'Lesson not found' } }, 404, origin);
        courseId = lesson.course_id;
      }
      const { data: enrollment, error: enrollmentError } = await admin
        .from('student_courses')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();
      if (enrollmentError || !enrollment) return json({ error: { message: 'You are not enrolled in this course' } }, 403, origin);

      const now = new Date().toISOString();
      const { data: progress, error: progressError } = await admin
        .from('lesson_progress')
        .upsert({
          student_id: user.id,
          lesson_id: lessonId,
          course_id: courseId,
          status: 'completed',
          progress_percentage: 100,
          completed_at: now,
          updated_at: now,
        }, { onConflict: 'student_id,lesson_id' })
        .select()
        .single();
      if (progressError) throw progressError;

      const [{ count: totalLessons }, { count: completedLessons }] = await Promise.all([
        admin.from('lessons').select('id', { count: 'exact', head: true }).eq('course_id', courseId).eq('is_published', true),
        admin.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('student_id', user.id).eq('course_id', courseId).eq('status', 'completed'),
      ]);
      const total = totalLessons || 0;
      const completed = completedLessons || 0;
      const percentage = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
      const update: Record<string, unknown> = { progress_percentage: percentage, last_accessed_at: now };
      if (percentage >= 100) update.completed_at = now;
      await admin.from('student_courses').update(update).eq('id', enrollment.id).eq('student_id', user.id);
      return json({ data: { progress, courseProgress: { courseId, completedLessons: completed, totalLessons: total, progressPercentage: percentage, courseCompleted: percentage >= 100 } } }, 200, origin);
    }

    if (request.method === 'GET' && path === '/parents/children') {
      const user = await requireUser();
      const { data: parent, error: parentError } = await admin.from('parents').select('id').eq('user_id', user.id).maybeSingle();
      if (parentError) throw parentError;
      if (!parent) return json({ data: { children: [] } }, 200, origin);
      const { data: links, error } = await admin
        .from('parent_children')
        .select('id,child_user_id,relationship,preferred_contact_method,notifications_enabled,created_at')
        .eq('parent_id', parent.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      const ids = (links || []).map((link: any) => link.child_user_id).filter(Boolean);
      let users: any[] = [];
      if (ids.length) {
        const result = await admin.from('users').select('id,first_name,last_name,avatar_url').in('id', ids);
        if (result.error) throw result.error;
        users = result.data || [];
      }
      const byId = new Map(users.map((child: any) => [child.id, child]));
      const children = (links || []).map((link: any) => {
        const child: any = byId.get(link.child_user_id) || {};
        return {
          id: link.id,
          userId: link.child_user_id,
          firstName: child.first_name || '',
          lastName: child.last_name || '',
          avatar: child.avatar_url || null,
          relationship: link.relationship,
          preferredContactMethod: link.preferred_contact_method,
          notificationsEnabled: link.notifications_enabled,
          joinedAt: link.created_at,
        };
      });
      return json({ data: { children } }, 200, origin);
    }

    const parentRoute = path.match(/^\/parents\/children\/([0-9a-f-]+)\/(performance|progress|study-time)$/i);
    if (request.method === 'GET' && parentRoute) {
      const user = await requireUser();
      const childId = parentRoute[1];
      const section = parentRoute[2];
      const { data: parent } = await admin.from('parents').select('id').eq('user_id', user.id).maybeSingle();
      if (!parent) return json({ error: { message: 'Parent profile not found' } }, 404, origin);
      const { data: link } = await admin.from('parent_children').select('id').eq('parent_id', parent.id).eq('child_user_id', childId).maybeSingle();
      if (!link) return json({ error: { message: 'Child is not linked to this parent account' } }, 404, origin);

      if (section === 'study-time') {
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        let query = admin.from('study_sessions').select('started_at,duration_seconds,course_id').eq('student_id', childId).not('ended_at', 'is', null).order('started_at', { ascending: true });
        if (startDate) query = query.gte('started_at', `${startDate}T00:00:00Z`);
        if (endDate) query = query.lt('started_at', new Date(new Date(`${endDate}T00:00:00Z`).getTime() + 86400000).toISOString());
        const { data, error } = await query;
        if (error) throw error;
        const days = new Map<string, { date: string; studyTimeSeconds: number; coursesStudied: string[] }>();
        for (const row of data || []) {
          const date = String(row.started_at).slice(0, 10);
          const item = days.get(date) || { date, studyTimeSeconds: 0, coursesStudied: [] };
          item.studyTimeSeconds += Number(row.duration_seconds || 0);
          if (row.course_id && !item.coursesStudied.includes(row.course_id)) item.coursesStudied.push(row.course_id);
          days.set(date, item);
        }
        return json({ data: { studyTime: [...days.values()] } }, 200, origin);
      }

      const [study, courses, lessons, exams, points, childUser] = await Promise.all([
        admin.from('study_sessions').select('duration_seconds,started_at').eq('student_id', childId).not('ended_at', 'is', null),
        admin.from('student_courses').select('course_id,completed_at,progress_percentage,last_accessed_at').eq('student_id', childId),
        admin.from('lesson_progress').select('lesson_id,updated_at').eq('student_id', childId).eq('status', 'completed'),
        admin.from('exam_attempts').select('exam_id,percentage,submitted_at').eq('student_id', childId).eq('status', 'submitted'),
        admin.from('student_points').select('current_streak').eq('user_id', childId).maybeSingle(),
        admin.from('users').select('id,first_name,last_name').eq('id', childId).maybeSingle(),
      ]);
      for (const result of [study, courses, lessons, exams, points, childUser]) if (result.error) throw result.error;

      const studyRows = study.data || [];
      const courseRows = courses.data || [];
      const lessonRows = lessons.data || [];
      const examRows = exams.data || [];
      const studyTimeSeconds = studyRows.reduce((sum: number, row: any) => sum + Number(row.duration_seconds || 0), 0);
      const examScores = examRows.map((row: any) => Number(row.percentage || 0));
      const averageExamScore = examScores.length ? examScores.reduce((a: number, b: number) => a + b, 0) / examScores.length : 0;
      const lastActivityCandidates = [
        ...studyRows.map((row: any) => row.started_at),
        ...courseRows.map((row: any) => row.last_accessed_at),
        ...lessonRows.map((row: any) => row.updated_at),
        ...examRows.map((row: any) => row.submitted_at),
      ].filter(Boolean).sort();
      const performance = {
        userId: childId,
        coursesEnrolled: courseRows.length,
        coursesCompleted: courseRows.filter((row: any) => row.completed_at).length,
        lessonsCompleted: lessonRows.length,
        examsTaken: new Set(examRows.map((row: any) => row.exam_id)).size,
        averageExamScore,
        studyTimeSeconds,
        currentStreak: Number(points.data?.current_streak || 0),
        lastActiveAt: lastActivityCandidates.at(-1) || null,
      };
      if (section === 'performance') return json({ data: { performance } }, 200, origin);

      const recentActivity = [
        ...lessonRows.map((row: any) => ({ type: 'lesson', title: 'Lesson completed', timestamp: row.updated_at })),
        ...examRows.map((row: any) => ({ type: 'exam', title: `Exam score ${Math.round(Number(row.percentage || 0))}%`, timestamp: row.submitted_at })),
      ].filter((row: any) => row.timestamp).sort((a: any, b: any) => String(b.timestamp).localeCompare(String(a.timestamp))).slice(0, 10);
      return json({ data: { progress: {
        enrolledCourses: courseRows.length,
        completedLessons: lessonRows.length,
        totalStudyTimeSeconds: studyTimeSeconds,
        averageCourseProgress: courseRows.length ? Math.round(courseRows.reduce((sum: number, row: any) => sum + Number(row.progress_percentage || 0), 0) / courseRows.length) : 0,
        examsTaken: performance.examsTaken,
        averageExamScore,
        quizzesTaken: performance.examsTaken,
        subjectPerformance: [],
        recentActivity,
        childName: [childUser.data?.first_name, childUser.data?.last_name].filter(Boolean).join(' ') || 'Student',
      } } }, 200, origin);
    }

    return json({ error: { message: `Route ${request.method} ${path} is not available in the Supabase web API` } }, 404, origin);
  } catch (error) {
    const status = Number((error as any)?.status || 500);
    const message = error instanceof Error ? error.message : 'Request failed';
    console.error('web-api request failed', { message, status });
    return json({ error: { message: status >= 500 ? 'Request failed' : message } }, status, origin);
  }
});
