import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

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
  token?: string
): Promise<PaginatedResponse<LibraryResource>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/library?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  const payload = await handleApiError(response) as any;
  const rawResources = payload?.data?.resources ?? payload?.resources ?? payload?.data ?? [];
  const pagination = payload?.data?.pagination ?? payload?.pagination ?? {};
  const resources = Array.isArray(rawResources) ? rawResources.map((resource: any): LibraryResource => ({
    id: String(resource.id),
    title: String(resource.title || 'Untitled resource'),
    resourceType: String(resource.resourceType ?? resource.resource_type ?? 'document'),
    fileUrl: String(resource.fileUrl ?? resource.file_url ?? ''),
    fileSizeBytes: resource.fileSizeBytes ?? resource.file_size_bytes ?? undefined,
    mimeType: resource.mimeType ?? resource.mime_type ?? undefined,
    description: resource.description ?? undefined,
    isDownloadable: Boolean(resource.isDownloadable ?? resource.is_downloadable ?? resource.fileUrl ?? resource.file_url),
    lessonId: resource.lessonId ?? resource.lesson_id ?? undefined,
    lessonTitle: resource.lessonTitle ?? resource.lesson_title ?? undefined,
    courseId: resource.courseId ?? resource.course_id ?? undefined,
    courseTitle: resource.courseTitle ?? resource.course_title ?? undefined,
    subjectId: resource.subjectId ?? resource.subject_id ?? undefined,
    classId: resource.classId ?? resource.class_id ?? undefined,
    createdAt: String(resource.createdAt ?? resource.created_at ?? ''),
  })) : [];
  const page = Number(pagination.page ?? filters.page ?? 1);
  const pageSize = Number(pagination.limit ?? pagination.pageSize ?? filters.limit ?? 20);
  const total = Number(pagination.total ?? resources.length);
  return { data: resources, page, pageSize, total, totalPages: Number(pagination.totalPages ?? pagination.total_pages ?? Math.max(1, Math.ceil(total / Math.max(1, pageSize)))) };
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
