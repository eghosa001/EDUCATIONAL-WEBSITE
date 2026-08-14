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
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchLibraryStats = async (token?: string): Promise<{ stats: LibraryStats }> => {
  const response = await fetch(`${baseUrl}/library/stats`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchLibraryResourceById = async (
  resourceId: string,
  token?: string
): Promise<{ resource: LibraryResource }> => {
  const response = await fetch(`${baseUrl}/library/${resourceId}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
