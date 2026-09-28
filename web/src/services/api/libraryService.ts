import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';
import { getSupabase } from '@/lib/supabase';

const { baseUrl } = apiConfig;

// ========== LIBRARY RESOURCES ==========

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

export interface LibraryFilters {
  page?: number;
  limit?: number;
  resourceType?: string;
  search?: string;
}

export interface LibraryStats {
  totalResources: number;
  pastQuestions: number;
  totalSubjects: number;
  publishedCourses: number;
}

export const fetchLibraryResources = async (
  filters: LibraryFilters = {},
  _token?: string
): Promise<PaginatedResponse<LibraryResource>> => {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const from = (page - 1) * limit;
  let query = getSupabase().from('library_resources').select('*', { count: 'exact' });
  if (filters.resourceType && filters.resourceType !== 'all') query = query.eq('resource_type', filters.resourceType);
  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%_,]/g, ' ');
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const { data, error, count } = await query.order('created_at', { ascending: false }).range(from, from + limit - 1);
  if (error) throw new Error(error.message);
  const resources: LibraryResource[] = (data || []).map((resource: any) => ({
    id: String(resource.id),
    title: String(resource.title || 'Untitled resource'),
    resourceType: String(resource.resource_type || 'document'),
    fileUrl: String(resource.file_url || ''),
    fileSizeBytes: resource.file_size_bytes ?? undefined,
    mimeType: resource.mime_type ?? undefined,
    description: resource.description ?? undefined,
    isDownloadable: Boolean(resource.file_url),
    subjectId: resource.subject_id ?? undefined,
    classId: resource.class_id ?? undefined,
    createdAt: String(resource.created_at || ''),
  }));
  const total = count || 0;
  return { data: resources, page, pageSize: limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
};

export const fetchLibraryStats = async (token?: string): Promise<{ stats: LibraryStats }> => {
  const response = await fetch(`${baseUrl}/library/stats`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchLibraryResourceById = async (
  resourceId: string,
  token?: string
): Promise<{ resource: LibraryResource }> => {
  const response = await fetch(`${baseUrl}/library/${resourceId}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
