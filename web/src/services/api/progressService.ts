import { getSupabase } from '@/lib/supabase';
import type { PaginatedResponse } from '@/types/api/api';

export interface StudentOverview { enrolledCourses: number; completedLessons: number; totalStudyTimeSeconds: number; averageCourseProgress: number; examsTaken: number; averageExamScore: number; }
export interface CourseProgress { courseId: string; progressPercentage: number; completedLessons: number; totalLessons: number; lastAccessedAt?: string; completedAt?: string; lessons: any[]; }
export interface StudySession { id: string; studentId: string; courseId?: string; lessonId?: string; activityType: 'watching' | 'reading' | 'quizzing' | 'revising' | 'other'; metadata?: Record<string, unknown>; startedAt: string; endedAt?: string; durationSeconds?: number; }
export interface StudySessionData { courseId?: string; lessonId?: string; activityType: 'watching' | 'reading' | 'quizzing' | 'revising' | 'other'; metadata?: Record<string, unknown>; }

const currentUserId = async () => {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new Error('You must be signed in');
  return data.user.id;
};

export const fetchStudentOverview = async (_token: string): Promise<{ overview: StudentOverview }> => {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const [{ data: enrollments }, { data: sessions }, { data: attempts }] = await Promise.all([
    supabase.from('student_courses').select('progress_percentage,courses(lesson_count)').eq('student_id', userId),
    supabase.from('study_sessions').select('duration_seconds').eq('student_id', userId),
    supabase.from('exam_attempts').select('percentage').eq('student_id', userId).not('submitted_at', 'is', null),
  ]);
  const enrolledCourses = enrollments?.length || 0;
  const averageCourseProgress = enrolledCourses ? (enrollments || []).reduce((sum: number, e: any) => sum + Number(e.progress_percentage || 0), 0) / enrolledCourses : 0;
  const completedLessons = (enrollments || []).reduce((sum: number, e: any) => sum + Math.round(Number(e.courses?.lesson_count || 0) * Number(e.progress_percentage || 0) / 100), 0);
  const totalStudyTimeSeconds = (sessions || []).reduce((sum: number, s: any) => sum + Number(s.duration_seconds || 0), 0);
  const examsTaken = attempts?.length || 0;
  const averageExamScore = examsTaken ? (attempts || []).reduce((sum: number, a: any) => sum + Number(a.percentage || 0), 0) / examsTaken : 0;
  return { overview: { enrolledCourses, completedLessons, totalStudyTimeSeconds, averageCourseProgress: Math.round(averageCourseProgress * 10) / 10, examsTaken, averageExamScore: Math.round(averageExamScore * 10) / 10 } };
};

export const fetchCourseProgress = async (courseId: string, _token: string): Promise<{ progress: CourseProgress }> => {
  const supabase = getSupabase();
  const userId = await currentUserId();
  const [{ data: enrollment, error }, { data: lessons }] = await Promise.all([
    supabase.from('student_courses').select('*').eq('student_id', userId).eq('course_id', courseId).maybeSingle(),
    supabase.from('lessons').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'),
  ]);
  if (error) throw new Error(error.message);
  const totalLessons = lessons?.length || 0;
  const progressPercentage = Number(enrollment?.progress_percentage || 0);
  return { progress: { courseId, progressPercentage, completedLessons: Math.round(totalLessons * progressPercentage / 100), totalLessons, lastAccessedAt: enrollment?.last_accessed_at, completedAt: enrollment?.completed_at, lessons: lessons || [] } };
};

export const startStudySession = async (sessionData: StudySessionData, _token: string): Promise<{ session: StudySession }> => {
  const userId = await currentUserId();
  const { data, error } = await getSupabase().from('study_sessions').insert({ student_id: userId, course_id: sessionData.courseId, lesson_id: sessionData.lessonId, activity_type: sessionData.activityType, metadata: sessionData.metadata || {}, started_at: new Date().toISOString() }).select().single();
  if (error) throw new Error(error.message);
  return { session: { ...data, studentId: data.student_id, courseId: data.course_id, lessonId: data.lesson_id, activityType: data.activity_type, startedAt: data.started_at } };
};

export const endStudySession = async (sessionId: string, _token: string): Promise<{ session: StudySession }> => {
  const userId = await currentUserId();
  const { data: existing, error: findError } = await getSupabase().from('study_sessions').select('*').eq('id', sessionId).eq('student_id', userId).single();
  if (findError) throw new Error(findError.message);
  const endedAt = new Date();
  const durationSeconds = Math.max(0, Math.floor((endedAt.getTime() - new Date(existing.started_at).getTime()) / 1000));
  const { data, error } = await getSupabase().from('study_sessions').update({ ended_at: endedAt.toISOString(), duration_seconds: durationSeconds }).eq('id', sessionId).eq('student_id', userId).select().single();
  if (error) throw new Error(error.message);
  return { session: { ...data, studentId: data.student_id, courseId: data.course_id, lessonId: data.lesson_id, activityType: data.activity_type, startedAt: data.started_at, endedAt: data.ended_at, durationSeconds: data.duration_seconds } };
};

export const fetchStudySessions = async (page = 1, limit = 20, _token: string): Promise<PaginatedResponse<StudySession>> => {
  const userId = await currentUserId();
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const { data, error, count } = await getSupabase().from('study_sessions').select('*', { count: 'exact' }).eq('student_id', userId).order('started_at', { ascending: false }).range(from, to);
  if (error) throw new Error(error.message);
  const sessions = (data || []).map((s: any) => ({ ...s, studentId: s.student_id, courseId: s.course_id, lessonId: s.lesson_id, activityType: s.activity_type, startedAt: s.started_at, endedAt: s.ended_at, durationSeconds: s.duration_seconds }));
  return { data: sessions, page, pageSize: limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) };
};
