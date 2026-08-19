import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Course, CourseSection } from '@/lib/shared/course';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface CourseFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export const fetchAdminCourses = async (
  token: string,
  filters: CourseFilters = {}
): Promise<{ courses: Course[]; pagination: Pagination }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await fetch(`${baseUrl}/courses?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  const body = (await handleApiError(response)) as {
    data?: { courses?: Course[] };
    pagination?: Pagination;
  };
  return { courses: body.data?.courses ?? [], pagination: body.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 } };
};

export const createAdminCourse = async (
  token: string,
  data: Partial<Course>
): Promise<{ course: Course }> => {
  const response = await fetch(`${baseUrl}/courses`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateAdminCourse = async (
  token: string,
  id: string,
  data: Partial<Course>
): Promise<{ course: Course }> => {
  const response = await fetch(`${baseUrl}/courses/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const publishAdminCourse = async (
  token: string,
  id: string
): Promise<{ course: Course }> => {
  const response = await fetch(`${baseUrl}/courses/${id}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const deleteAdminCourse = async (
  token: string,
  id: string
): Promise<void> => {
  const response = await fetch(`${baseUrl}/courses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchAdminCourseLessons = async (
  token: string,
  courseId: string
): Promise<{ lessons: any[] }> => {
  const response = await fetch(`${baseUrl}/courses/${courseId}/lessons`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
