import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface Lesson {
  id: string;
  courseId: string;
  sectionId?: string;
  title: string;
  description?: string;
  contentType: string;
  videoUrl?: string;
  isPublished: boolean;
  orderIndex: number;
  estimatedMinutes?: number;
  viewCount: number;
  completionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonFilters {
  page?: number;
  limit?: number;
  courseId?: string;
  isPublished?: boolean;
}

export const fetchAdminLessons = async (
  token: string,
  filters: LessonFilters = {}
): Promise<{ lessons: Lesson[]; pagination: Pagination }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await fetch(`${baseUrl}/lessons?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  const body = (await handleApiError(response)) as {
    data?: { lessons?: Lesson[] };
    pagination?: Pagination;
  };
  return { lessons: body.data?.lessons ?? [], pagination: body.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 } };
};

export const createAdminLesson = async (
  token: string,
  data: Partial<Lesson>
): Promise<{ lesson: Lesson }> => {
  const response = await fetch(`${baseUrl}/lessons`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateAdminLesson = async (
  token: string,
  id: string,
  data: Partial<Lesson>
): Promise<{ lesson: Lesson }> => {
  const response = await fetch(`${baseUrl}/lessons/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const publishAdminLesson = async (
  token: string,
  id: string
): Promise<{ lesson: Lesson }> => {
  const response = await fetch(`${baseUrl}/lessons/${id}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const deleteAdminLesson = async (
  token: string,
  id: string
): Promise<void> => {
  const response = await fetch(`${baseUrl}/lessons/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
