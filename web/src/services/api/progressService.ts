import { getSupabase } from '@/lib/supabase';
import type { PaginatedResponse } from '@/types/api/api';

export interface StudentOverview {
  enrolledCourses: number;
  completedLessons: number;
  totalStudyTimeSeconds: number;
  averageCourseProgress: number;
  examsTaken: number;
  averageExamScore: number;
}
export interface CourseProgress {
  courseId: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
  completedAt?: string;
  lessons: any[];
}
export interface StudySession {
  id: string;
  studentId: string;
  courseId?: string;
  lessonId?: string;
  activityType: 'watching' | 'reading' | 'quizzing' | 'revising' | 'other';
  metadata?: Record<string, unknown>;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
}
export interface StudySessionData {
  courseId?: string;
  lessonId?: string;
  activityType: 'watching' | 'reading' | 'quizzing' | 'revising' | 'other';
  metadata?: Record<string, unknown>;
}
export interface TopicInsight {
  topicId: string;
  topicName: string;
  subjectName: string;
  attempts: number;
  correct: number;
  accuracy: number;
}
export interface SubjectInsight {
  subjectId: string;
  subjectName: string;
  practiceAttempts: number;
  practiceAccuracy: number | null;
  examsTaken: number;
  averageExamScore: number | null;
}
export interface ActivityDay {
  date: string;
  label: string;
  practice: number;
  lessons: number;
  exams: number;
  studyMinutes: number;
}
export interface StudentFocus {
  dueCount: number | null;
  weakTopic: {
    topicId: string;
    topicName: string;
    subjectName: string;
    attempts: number;
    correct: number;
    accuracy: number;
  } | null;
  partialFailure: boolean;
}

export interface LearningInsights {
  practiceAttempts: number;
  practiceCorrect: number;
  practiceAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  strongTopics: TopicInsight[];
  weakTopics: TopicInsight[];
  subjects: SubjectInsight[];
  weeklyActivity: ActivityDay[];
  recentExamScores: number[];
}

const currentUserId = async () => {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in');
  return data.user.id;
};

const localDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const dateFromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const calculateStreaks = (keys: string[]) => {
  const unique = [...new Set(keys.filter(Boolean))].sort();
  if (!unique.length) return { currentStreak: 0, longestStreak: 0 };

  let longestStreak = 1;
  let running = 1;
  for (let i = 1; i < unique.length; i += 1) {
    const diff = Math.round((dateFromKey(unique[i]).getTime() - dateFromKey(unique[i - 1]).getTime()) / 86400000);
    running = diff === 1 ? running + 1 : 1;
    longestStreak = Math.max(longestStreak, running);
  }

  const today = localDateKey(new Date());
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = localDateKey(yesterdayDate);
  const latest = unique[unique.length - 1];
  if (latest !== today && latest !== yesterday) return { currentStreak: 0, longestStreak };

  let currentStreak = 1;
  for (let i = unique.length - 1; i > 0; i -= 1) {
    const diff = Math.round((dateFromKey(unique[i]).getTime() - dateFromKey(unique[i - 1]).getTime()) / 86400000);
    if (diff !== 1) break;
    currentStreak += 1;
  }
  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
};

/**
 * Small evidence sample for the learner homepage. Do not download the entire
 * study history or run the full analytics aggregation simply to render a
 * quick next-step suggestion. Counts remain user-scoped through RLS.
 */
export const fetchStudentFocus = async (_token: string): Promise<StudentFocus> => {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const [practiceResult, dueResult] = await Promise.allSettled([
    supabase.from('lesson_practice_attempts')
      .select('topic_id,is_correct')
      .eq('user_id', userId)
      .not('topic_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(160),
    supabase.from('flashcard_reviews')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString()),
  ]);
  let partialFailure = false;
  let dueCount: number | null = null;
  let weakTopic: StudentFocus['weakTopic'] = null;

  if (dueResult.status === 'fulfilled' && !dueResult.value.error) {
    dueCount = dueResult.value.count ?? 0;
  } else {
    partialFailure = true;
  }

  if (practiceResult.status === 'fulfilled' && !practiceResult.value.error) {
    const stats = new Map<string, { attempts: number; correct: number }>();
    for (const row of practiceResult.value.data || []) {
      if (!row.topic_id) continue;
      const key = String(row.topic_id);
      const current = stats.get(key) || { attempts: 0, correct: 0 };
      current.attempts += 1;
      if (row.is_correct) current.correct += 1;
      stats.set(key, current);
    }
    const candidates = [...stats.entries()]
      .map(([topicId, result]) => ({
        topicId,
        ...result,
        accuracy: Math.round((result.correct / result.attempts) * 100),
      }))
      .filter(result => result.attempts >= 3 && result.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
      .slice(0, 12);
    if (candidates.length) {
      const { data: topics, error } = await supabase.from('topics')
        .select('id,name,subject_id,class_id')
        .in('id', candidates.map(item => item.topicId))
        .eq('is_active', true);
      if (error) partialFailure = true;
      else {
        const topicMap = new Map((topics || []).map(row => [row.id, row]));
        const best = candidates.find(item => {
          const topic = topicMap.get(item.topicId);
          return Boolean(topic?.class_id && topic?.subject_id);
        });
        if (best) {
          const topic = topicMap.get(best.topicId)!;
          const subjectResult = await supabase.from('subjects')
            .select('name').eq('id', topic.subject_id).maybeSingle();
          if (subjectResult.error) partialFailure = true;
          weakTopic = {
            topicId: best.topicId,
            topicName: topic.name || 'Your weak topic',
            subjectName: subjectResult.data?.name || 'Subject',
            attempts: best.attempts,
            correct: best.correct,
            accuracy: best.accuracy,
          };
        }
      }
    }
  } else {
    partialFailure = true;
  }
  if (practiceResult.status === 'rejected' && dueResult.status === 'rejected') {
    throw new Error('Unable to load your recent learning signals.');
  }
  return { dueCount, weakTopic, partialFailure };
};

export const fetchStudentOverview = async (_token: string): Promise<{ overview: StudentOverview }> => {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const [{ data: enrollments, error: enrollmentError }, { data: completed, error: completedError }, { data: sessions, error: sessionError }, { data: attempts, error: attemptError }] = await Promise.all([
    supabase.from('student_courses').select('progress_percentage').eq('student_id', userId),
    supabase.from('lesson_progress').select('id').eq('student_id', userId).eq('status', 'completed'),
    supabase.from('study_sessions').select('duration_seconds').eq('student_id', userId),
    supabase.from('exam_attempts').select('percentage').eq('student_id', userId).not('submitted_at', 'is', null),
  ]);
  const error = enrollmentError || completedError || sessionError || attemptError;
  if (error) throw new Error(error.message);

  const enrolledCourses = enrollments?.length || 0;
  const averageCourseProgress = enrolledCourses
    ? (enrollments || []).reduce((sum: number, row: any) => sum + Number(row.progress_percentage || 0), 0) / enrolledCourses
    : 0;
  const totalStudyTimeSeconds = (sessions || []).reduce((sum: number, row: any) => sum + Math.max(0, Number(row.duration_seconds || 0)), 0);
  const examsTaken = attempts?.length || 0;
  const averageExamScore = examsTaken
    ? (attempts || []).reduce((sum: number, row: any) => sum + Number(row.percentage || 0), 0) / examsTaken
    : 0;

  return {
    overview: {
      enrolledCourses,
      completedLessons: completed?.length || 0,
      totalStudyTimeSeconds,
      averageCourseProgress: Math.round(averageCourseProgress * 10) / 10,
      examsTaken,
      averageExamScore: Math.round(averageExamScore * 10) / 10,
    },
  };
};

export const fetchLearningInsights = async (_token: string): Promise<LearningInsights> => {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const [
    { data: practiceRows, error: practiceError },
    { data: lessonRows, error: lessonError },
    { data: sessionRows, error: sessionError },
    { data: examRows, error: examError },
  ] = await Promise.all([
    supabase.from('lesson_practice_attempts').select('topic_id,subject_id,is_correct,created_at').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('lesson_progress').select('status,completed_at,updated_at').eq('student_id', userId).eq('status', 'completed'),
    supabase.from('study_sessions').select('started_at,duration_seconds').eq('student_id', userId),
    supabase.from('exam_attempts').select('exam_id,percentage,submitted_at,started_at').eq('student_id', userId).not('submitted_at', 'is', null).order('submitted_at', { ascending: false }),
  ]);
  const error = practiceError || lessonError || sessionError || examError;
  if (error) throw new Error(error.message);

  const topicIds = [...new Set((practiceRows || []).map((row: any) => row.topic_id).filter(Boolean))];
  const directSubjectIds = [...new Set((practiceRows || []).map((row: any) => row.subject_id).filter(Boolean))];
  const examIds = [...new Set((examRows || []).map((row: any) => row.exam_id).filter(Boolean))];

  let topics: any[] = [];
  let exams: any[] = [];
  if (topicIds.length) {
    const result = await supabase.from('topics').select('id,name,subject_id').in('id', topicIds);
    if (result.error) throw new Error(result.error.message);
    topics = result.data || [];
  }
  if (examIds.length) {
    const result = await supabase.from('exams').select('id,title,subject_id').in('id', examIds);
    if (result.error) throw new Error(result.error.message);
    exams = result.data || [];
  }

  const allSubjectIds = [...new Set([
    ...directSubjectIds,
    ...topics.map((row: any) => row.subject_id).filter(Boolean),
    ...exams.map((row: any) => row.subject_id).filter(Boolean),
  ])];
  let subjects: any[] = [];
  if (allSubjectIds.length) {
    const result = await supabase.from('subjects').select('id,name').in('id', allSubjectIds);
    if (result.error) throw new Error(result.error.message);
    subjects = result.data || [];
  }

  const topicMap = new Map(topics.map((row: any) => [String(row.id), row]));
  const examMap = new Map(exams.map((row: any) => [String(row.id), row]));
  const subjectMap = new Map(subjects.map((row: any) => [String(row.id), String(row.name || 'Subject')]));

  const topicStats = new Map<string, { topicId: string; topicName: string; subjectName: string; attempts: number; correct: number }>();
  let practiceCorrect = 0;
  for (const row of practiceRows || []) {
    if (row.is_correct) practiceCorrect += 1;
    if (!row.topic_id) continue;
    const topic = topicMap.get(String(row.topic_id));
    const current = topicStats.get(String(row.topic_id)) || {
      topicId: String(row.topic_id),
      topicName: String(topic?.name || 'Topic'),
      subjectName: subjectMap.get(String(row.subject_id || topic?.subject_id || '')) || 'Subject',
      attempts: 0,
      correct: 0,
    };
    current.attempts += 1;
    if (row.is_correct) current.correct += 1;
    topicStats.set(current.topicId, current);
  }

  const normalizedTopics: TopicInsight[] = [...topicStats.values()].map((row) => ({
    ...row,
    accuracy: row.attempts ? Math.round((row.correct / row.attempts) * 100) : 0,
  }));
  const strongTopics = normalizedTopics
    .filter((row) => row.attempts >= 3 && row.accuracy >= 75)
    .sort((a, b) => b.accuracy - a.accuracy || b.attempts - a.attempts)
    .slice(0, 6);
  const weakTopics = normalizedTopics
    .filter((row) => row.attempts >= 3 && row.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy || b.attempts - a.attempts)
    .slice(0, 6);

  const subjectStats = new Map<string, { subjectId: string; subjectName: string; practiceAttempts: number; practiceCorrect: number; examScores: number[] }>();
  const ensureSubject = (subjectId: string) => {
    const key = String(subjectId || '');
    if (!key) return null;
    const existing = subjectStats.get(key);
    if (existing) return existing;
    const created = { subjectId: key, subjectName: subjectMap.get(key) || 'Subject', practiceAttempts: 0, practiceCorrect: 0, examScores: [] as number[] };
    subjectStats.set(key, created);
    return created;
  };
  for (const row of practiceRows || []) {
    const topic = row.topic_id ? topicMap.get(String(row.topic_id)) : null;
    const subject = ensureSubject(String(row.subject_id || topic?.subject_id || ''));
    if (!subject) continue;
    subject.practiceAttempts += 1;
    if (row.is_correct) subject.practiceCorrect += 1;
  }
  for (const row of examRows || []) {
    const exam = examMap.get(String(row.exam_id || ''));
    const subject = ensureSubject(String(exam?.subject_id || ''));
    if (!subject || row.percentage == null) continue;
    subject.examScores.push(Number(row.percentage));
  }
  const subjectInsights: SubjectInsight[] = [...subjectStats.values()]
    .map((row) => ({
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      practiceAttempts: row.practiceAttempts,
      practiceAccuracy: row.practiceAttempts ? Math.round((row.practiceCorrect / row.practiceAttempts) * 100) : null,
      examsTaken: row.examScores.length,
      averageExamScore: row.examScores.length ? Math.round((row.examScores.reduce((sum, score) => sum + score, 0) / row.examScores.length) * 10) / 10 : null,
    }))
    .sort((a, b) => (b.practiceAttempts + b.examsTaken) - (a.practiceAttempts + a.examsTaken));

  const activityKeys = [
    ...(practiceRows || []).map((row: any) => localDateKey(row.created_at)),
    ...(lessonRows || []).map((row: any) => localDateKey(row.completed_at || row.updated_at)),
    ...(sessionRows || []).map((row: any) => localDateKey(row.started_at)),
    ...(examRows || []).map((row: any) => localDateKey(row.submitted_at || row.started_at)),
  ].filter(Boolean);
  const { currentStreak, longestStreak } = calculateStreaks(activityKeys);

  const weeklyActivity: ActivityDay[] = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = localDateKey(day);
    weeklyActivity.push({
      date: key,
      label: day.toLocaleDateString(undefined, { weekday: 'short' }),
      practice: (practiceRows || []).filter((row: any) => localDateKey(row.created_at) === key).length,
      lessons: (lessonRows || []).filter((row: any) => localDateKey(row.completed_at || row.updated_at) === key).length,
      exams: (examRows || []).filter((row: any) => localDateKey(row.submitted_at || row.started_at) === key).length,
      studyMinutes: Math.round((sessionRows || [])
        .filter((row: any) => localDateKey(row.started_at) === key)
        .reduce((sum: number, row: any) => sum + Math.max(0, Number(row.duration_seconds || 0)), 0) / 60),
    });
  }

  const recentExamScores = (examRows || [])
    .filter((row: any) => row.percentage != null)
    .slice(0, 5)
    .map((row: any) => Math.round(Number(row.percentage) * 10) / 10);

  const practiceAttempts = practiceRows?.length || 0;
  return {
    practiceAttempts,
    practiceCorrect,
    practiceAccuracy: practiceAttempts ? Math.round((practiceCorrect / practiceAttempts) * 100) : 0,
    currentStreak,
    longestStreak,
    strongTopics,
    weakTopics,
    subjects: subjectInsights,
    weeklyActivity,
    recentExamScores,
  };
};

export const fetchCourseProgress = async (courseId: string, _token: string): Promise<{ progress: CourseProgress }> => {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const [{ data: enrollment, error }, { data: lessons, error: lessonsError }, { data: completed, error: completedError }] = await Promise.all([
    supabase.from('student_courses').select('*').eq('student_id', userId).eq('course_id', courseId).maybeSingle(),
    supabase.from('lessons').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'),
    supabase.from('lesson_progress').select('lesson_id').eq('student_id', userId).eq('course_id', courseId).eq('status', 'completed'),
  ]);
  const queryError = error || lessonsError || completedError;
  if (queryError) throw new Error(queryError.message);
  const totalLessons = lessons?.length || 0;
  const completedLessons = new Set((completed || []).map((row: any) => row.lesson_id)).size;
  const progressPercentage = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
  return {
    progress: {
      courseId,
      progressPercentage,
      completedLessons,
      totalLessons,
      lastAccessedAt: enrollment?.last_accessed_at,
      completedAt: enrollment?.completed_at,
      lessons: lessons || [],
    },
  };
};

export const startStudySession = async (sessionData: StudySessionData, _token: string): Promise<{ session: StudySession }> => {
  const userId = await currentUserId();
  const { data, error } = await getSupabase().from('study_sessions').insert({
    student_id: userId,
    course_id: sessionData.courseId,
    lesson_id: sessionData.lessonId,
    activity_type: sessionData.activityType,
    metadata: sessionData.metadata || {},
    started_at: new Date().toISOString(),
  }).select().single();
  if (error) throw new Error(error.message);
  return {
    session: {
      ...data,
      studentId: data.student_id,
      courseId: data.course_id,
      lessonId: data.lesson_id,
      activityType: data.activity_type,
      startedAt: data.started_at,
    },
  };
};

export const endStudySession = async (sessionId: string, _token: string): Promise<{ session: StudySession }> => {
  const userId = await currentUserId();
  const { data: existing, error: findError } = await getSupabase().from('study_sessions').select('*').eq('id', sessionId).eq('student_id', userId).single();
  if (findError) throw new Error(findError.message);
  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - new Date(existing.started_at).getTime()) / 1000));
  const { data, error } = await getSupabase().from('study_sessions').update({
    ended_at: endedAt.toISOString(),
    duration_seconds: durationSeconds,
  }).eq('id', sessionId).eq('student_id', userId).select().single();
  if (error) throw new Error(error.message);
  return {
    session: {
      ...data,
      studentId: data.student_id,
      courseId: data.course_id,
      lessonId: data.lesson_id,
      activityType: data.activity_type,
      startedAt: data.started_at,
      endedAt: data.ended_at,
      durationSeconds: data.duration_seconds,
    },
  };
};

export const fetchStudySessions = async (page = 1, limit = 20, _token: string): Promise<PaginatedResponse<StudySession>> => {
  const userId = await currentUserId();
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await getSupabase().from('study_sessions').select('*', { count: 'exact' }).eq('student_id', userId).order('started_at', { ascending: false }).range(from, to);
  if (error) throw new Error(error.message);
  const sessions = (data || []).map((row: any) => ({
    ...row,
    studentId: row.student_id,
    courseId: row.course_id,
    lessonId: row.lesson_id,
    activityType: row.activity_type,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    durationSeconds: row.duration_seconds,
  }));
  return { data: sessions, page, pageSize: limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) };
};
