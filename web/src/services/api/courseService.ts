import { getSupabase } from '@/lib/supabase';
import type { Course, CourseSection } from '@/types/models/course';
import type { PaginatedResponse } from '@/types/api/api';

export interface CourseFilters { page?: number; limit?: number; status?: string; subjectId?: string; classId?: string; teacherId?: string; search?: string; featured?: boolean; }
export interface CourseStats { enrollmentCount: number; lessonCount: number; }

const mapCourse = (row: any): Course & { classId?: string; termId?: string } => ({
  id: row.id, title: row.title, slug: row.slug, description: row.full_description, shortDescription: row.short_description,
  subjectId: row.subject_id, classId: row.class_id, termId: row.term_id, teacherId: row.teacher_id, coverImage: row.thumbnail_url, thumbnailUrl: row.thumbnail_url,
  status: row.status, lessonCount: row.lesson_count, enrollmentCount: row.enrollment_count, totalDurationHours: row.total_duration_hours,
  estimatedDuration: row.total_duration_hours, difficulty: row.difficulty, isFree: row.is_free, price: row.price,
  currency: row.currency, rating: row.rating, createdAt: row.created_at, updatedAt: row.updated_at,
});

const pageResult = <T,>(data: T[], page: number, limit: number, total: number): PaginatedResponse<T> => ({ data, page, pageSize: limit, total, totalPages: Math.ceil(total / limit) });

export const fetchCourses = async (filters: CourseFilters = {}, _token?: string): Promise<PaginatedResponse<Course>> => {
  const supabase = getSupabase(); const page = Math.max(1, filters.page || 1); const limit = Math.min(100, Math.max(1, filters.limit || 12));
  const from = (page - 1) * limit; const to = from + limit - 1;
  let query = supabase.from('courses').select('*', { count: 'exact' }).order('created_at', { ascending: false });
  if (filters.status) query = query.eq('status', filters.status); if (filters.subjectId) query = query.eq('subject_id', filters.subjectId);
  if (filters.classId) query = query.eq('class_id', filters.classId); if (filters.teacherId) query = query.eq('teacher_id', filters.teacherId);
  if (filters.featured !== undefined) query = query.eq('is_featured', filters.featured); if (filters.search?.trim()) query = query.ilike('title', `%${filters.search.trim()}%`);
  const { data, error, count } = await query.range(from, to); if (error) throw new Error(error.message);
  return pageResult((data || []).map(mapCourse), page, limit, count || 0);
};

export const fetchFeaturedCourses = (page = 1, limit = 10, token?: string) => fetchCourses({ page, limit, status: 'published', featured: true }, token);

/** Loads a course as a complete learning graph. Lessons are the source of truth; legacy section links are retained when present. */
export const fetchCourseByIdOrSlug = async (idOrSlug: string, _token?: string): Promise<{ course: Course & { classId?: string; termId?: string; sections: CourseSection[]; lessons: any[] } }> => {
  const supabase = getSupabase();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idOrSlug);
  const courseQuery = supabase.from('courses').select('*').limit(1);
  const result = isUuid ? await courseQuery.eq('id', idOrSlug).maybeSingle() : await courseQuery.eq('slug', idOrSlug).maybeSingle();
  if (result.error) throw new Error(result.error.message); if (!result.data) throw new Error('Course not found');
  const row: any = result.data;

  const [{ data: sections, error: sectionsError }, { data: lessons, error: lessonsError }] = await Promise.all([
    supabase.from('course_sections').select('*').eq('course_id', row.id).eq('is_active', true).order('order_index'),
    supabase.from('lessons').select('*').eq('course_id', row.id).eq('is_published', true).order('order_index'),
  ]);
  if (sectionsError) throw new Error(sectionsError.message); if (lessonsError) throw new Error(lessonsError.message);

  const mappedLessons = (lessons || []).map((l: any) => ({
    ...l,
    estimatedMinutes: l.estimated_minutes,
    isPublished: l.is_published,
    // Preserve whichever generation/import produced the content; the UI can fall back to older fields.
    content: l.written_content || l.description || l.content || l.body || '',
    legacyContent: l.original_content || l.previous_content || l.legacy_content || null,
  }));

  const topicIds = [...new Set(mappedLessons.map((l: any) => l.topic_id).filter(Boolean))];
  let topics: any[] = [];
  if (topicIds.length) {
    const { data, error } = await supabase.from('topics').select('id,title,name,description,order_index,subject_id,term_id').in('id', topicIds).order('order_index');
    if (!error) topics = data || [];
  }
  const topicMap = new Map(topics.map((t: any) => [t.id, t]));

  const mappedSections = (sections || []).map((s: any) => ({
    ...s,
    courseId: s.course_id,
    orderIndex: s.order_index,
    lessons: mappedLessons.filter((l: any) => l.section_id === s.id),
  }));

  // Add topic groups without discarding the former course_sections structure.
  const topicGroups = topicIds.map(topicId => ({
    id: `topic-${topicId}`,
    title: topicMap.get(topicId)?.title || topicMap.get(topicId)?.name || 'Topic',
    description: topicMap.get(topicId)?.description || '',
    order_index: topicMap.get(topicId)?.order_index ?? 999,
    is_active: true,
    course_id: row.id,
    lessons: mappedLessons.filter((l: any) => l.topic_id === topicId),
  })).sort((a: any, b: any) => a.order_index - b.order_index);

  return { course: { ...mapCourse(row), sections: [...mappedSections, ...topicGroups], lessons: mappedLessons } };
};

export const createCourse = async (courseData: Partial<Course>, _token: string) => { const { data, error } = await getSupabase().from('courses').insert({ title: courseData.title, slug: courseData.slug, short_description: courseData.shortDescription, full_description: courseData.description, subject_id: courseData.subjectId, teacher_id: courseData.teacherId, status: courseData.status || 'draft', difficulty: courseData.difficulty, is_free: courseData.isFree ?? true, price: courseData.price || 0, currency: courseData.currency || 'NGN', thumbnail_url: courseData.thumbnailUrl }).select().single(); if (error) throw new Error(error.message); return { course: mapCourse(data) }; };
export const updateCourse = async (courseId: string, courseData: Partial<Course>, _token: string) => { const patch: any = {}; if (courseData.title !== undefined) patch.title = courseData.title; if (courseData.slug !== undefined) patch.slug = courseData.slug; if (courseData.shortDescription !== undefined) patch.short_description = courseData.shortDescription; if (courseData.description !== undefined) patch.full_description = courseData.description; if (courseData.status !== undefined) patch.status = courseData.status; if (courseData.difficulty !== undefined) patch.difficulty = courseData.difficulty; if (courseData.isFree !== undefined) patch.is_free = courseData.isFree; if (courseData.price !== undefined) patch.price = courseData.price; if (courseData.thumbnailUrl !== undefined) patch.thumbnail_url = courseData.thumbnailUrl; const { data, error } = await getSupabase().from('courses').update(patch).eq('id', courseId).select().single(); if (error) throw new Error(error.message); return { course: mapCourse(data) }; };
export const publishCourse = async (courseId: string, _token: string) => updateCourse(courseId, { status: 'published' }, _token);
export const deleteCourse = async (courseId: string, _token: string) => { const { error } = await getSupabase().from('courses').delete().eq('id', courseId); if (error) throw new Error(error.message); return { success: true }; };
export const fetchCourseStats = async (courseId: string, _token: string): Promise<CourseStats> => { const supabase = getSupabase(); const [{ count: enrollmentCount }, { count: lessonCount }] = await Promise.all([supabase.from('student_courses').select('*', { count: 'exact', head: true }).eq('course_id', courseId), supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', courseId)]); return { enrollmentCount: enrollmentCount || 0, lessonCount: lessonCount || 0 }; };
export const enrollInCourse = async (courseId: string, _token: string) => { const { data: auth } = await getSupabase().auth.getUser(); if (!auth.user) throw new Error('You must be signed in to enroll'); const { data, error } = await getSupabase().from('student_courses').insert({ student_id: auth.user.id, course_id: courseId }).select().single(); if (error) throw new Error(error.code === '23505' ? 'You are already enrolled in this course' : error.message); return { enrollment: data }; };
export const unenrollFromCourse = async (courseId: string, _token: string) => { const { data: auth } = await getSupabase().auth.getUser(); if (!auth.user) throw new Error('You must be signed in'); const { error } = await getSupabase().from('student_courses').delete().eq('student_id', auth.user.id).eq('course_id', courseId); if (error) throw new Error(error.message); return { success: true }; };
export const fetchMyCourses = async (_token: string): Promise<{ courses: any[] }> => { const supabase = getSupabase(); const { data: auth } = await supabase.auth.getUser(); if (!auth.user) return { courses: [] }; const { data, error } = await supabase.from('student_courses').select('*, courses(*)').eq('student_id', auth.user.id).order('last_accessed_at', { ascending: false, nullsFirst: false }); if (error) throw new Error(error.message); return { courses: (data || []).map((row: any) => ({ ...row, courseId: row.course_id, courseTitle: row.courses?.title || 'Course', courseThumbnail: row.courses?.thumbnail_url, progressPercentage: Number(row.progress_percentage || 0), lastAccessedAt: row.last_accessed_at || row.enrolled_at })) }; };
export const fetchCourseStudents = async (courseId: string, _token: string) => { const { data, error } = await getSupabase().from('student_courses').select('*, profiles(*)').eq('course_id', courseId); if (error) throw new Error(error.message); return { students: data || [] }; };
export interface CourseSectionData { title: string; description?: string; orderIndex: number; }
export const createCourseSection = async (courseId: string, sectionData: CourseSectionData, _token: string) => { const { data, error } = await getSupabase().from('course_sections').insert({ course_id: courseId, title: sectionData.title, description: sectionData.description, order_index: sectionData.orderIndex }).select().single(); if (error) throw new Error(error.message); return { section: data }; };
export const updateCourseSection = async (courseId: string, sectionId: string, sectionData: Partial<CourseSectionData>, _token: string) => { const { data, error } = await getSupabase().from('course_sections').update({ title: sectionData.title, description: sectionData.description, order_index: sectionData.orderIndex }).eq('id', sectionId).eq('course_id', courseId).select().single(); if (error) throw new Error(error.message); return { section: data }; };
export const deleteCourseSection = async (courseId: string, sectionId: string, _token: string) => { const { error } = await getSupabase().from('course_sections').delete().eq('id', sectionId).eq('course_id', courseId); if (error) throw new Error(error.message); return { success: true }; };
export const fetchCourseLessons = async (courseId: string, _token?: string) => { const { data, error } = await getSupabase().from('lessons').select('*').eq('course_id', courseId).eq('is_published', true).order('order_index'); if (error) throw new Error(error.message); return { lessons: (data || []).map((l: any) => ({ ...l, estimatedMinutes: l.estimated_minutes, isPublished: l.is_published, content: l.written_content || l.description || l.content || l.body || '', legacyContent: l.original_content || l.previous_content || l.legacy_content || null })) }; };
