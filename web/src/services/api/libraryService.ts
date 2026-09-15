import { getSupabase } from '@/lib/supabase';
import type { PaginatedResponse } from '@/types/api/api';

export interface LibraryResource {
  id: string;
  title: string;
  resourceType: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  description?: string;
  isDownloadable: boolean;
  lessonId?: string;
  lessonTitle?: string;
  courseId?: string;
  courseTitle?: string;
  subjectId?: string;
  classId?: string;
  createdAt: string;
}

export interface LibraryFilters { page?: number; limit?: number; resourceType?: string; search?: string; }
export interface LibraryStats { totalResources: number; pastQuestions: number; totalSubjects: number; publishedCourses: number; }

const mapRow = (row: any): LibraryResource => ({
  id: row.id,
  title: row.title,
  resourceType: row.resource_type,
  fileUrl: row.file_url || '',
  fileSizeBytes: row.file_size_bytes == null ? undefined : Number(row.file_size_bytes),
  mimeType: row.mime_type || undefined,
  description: row.description || undefined,
  isDownloadable: /^https?:\/\//i.test(row.file_url || ''),
  subjectId: row.subject_id || undefined,
  classId: row.class_id || undefined,
  createdAt: row.created_at,
});

export const fetchLibraryResources = async (filters: LibraryFilters = {}, _token?: string): Promise<PaginatedResponse<LibraryResource>> => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const from = (page - 1) * limit;
  let query = getSupabase().from('library_resources').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, from + limit - 1);
  if (filters.resourceType) query = query.eq('resource_type', filters.resourceType);
  if (filters.search) query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data: (data || []).map(mapRow), page, pageSize: limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) };
};

export const fetchLibraryStats = async (_token?: string): Promise<{ stats: LibraryStats }> => {
  const supabase = getSupabase();
  const [resources, pastQuestions, subjects, courses] = await Promise.all([
    supabase.from('library_resources').select('id', { count: 'exact', head: true }),
    supabase.from('past_questions').select('id', { count: 'exact', head: true }),
    supabase.from('subjects').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ]);
  const firstError = resources.error || pastQuestions.error || subjects.error || courses.error;
  if (firstError) throw new Error(firstError.message);
  return { stats: { totalResources: resources.count || 0, pastQuestions: pastQuestions.count || 0, totalSubjects: subjects.count || 0, publishedCourses: courses.count || 0 } };
};

export const fetchLibraryResourceById = async (resourceId: string, _token?: string): Promise<{ resource: LibraryResource }> => {
  const { data, error } = await getSupabase().from('library_resources').select('*').eq('id', resourceId).maybeSingle();
  if (error || !data) throw new Error(error?.message || 'Resource not found');
  return { resource: mapRow(data) };
};
