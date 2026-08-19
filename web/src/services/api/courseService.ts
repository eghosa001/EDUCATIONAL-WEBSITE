import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Course, CourseSection } from '@/types/models/course';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== COURSES ==========

export interface CourseFilters {
  page?: number;
  limit?: number;
  status?: string;
  subjectId?: string;
  classId?: string;
  teacherId?: string;
  search?: string;
  featured?: boolean;
}

export interface CourseStats {
  enrollmentCount: number;
  lessonCount: number;
}

export const fetchCourses = async (
  filters: CourseFilters = {},
  token?: string
): Promise<PaginatedResponse<Course>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/courses?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchFeaturedCourses = async (
  page: number = 1,
  limit: number = 10,
  token?: string
): Promise<PaginatedResponse<Course>> => {
  const response = await fetch(
    `${baseUrl}/courses/featured?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders(token), credentials: 'include' }
  );
  return handleApiError(response);
};

export const fetchCourseByIdOrSlug = async (
  idOrSlug: string,
  token?: string
): Promise<{ course: Course & { sections: CourseSection[]; lessons: any[] } }> => {
  const response = await fetch(`${baseUrl}/courses/${idOrSlug}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createCourse = async (courseData: Partial<Course>, token: string) => {
  const response = await fetch(`${baseUrl}/courses`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(courseData), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateCourse = async (
  courseId: string,
  courseData: Partial<Course>,
  token: string
) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(courseData), credentials: 'include'
  });
  return handleApiError(response);
};

export const publishCourse = async (courseId: string, token: string) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const deleteCourse = async (courseId: string, token: string) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchCourseStats = async (courseId: string, token: string) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}/stats`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== COURSE ENROLLMENT ==========

export const enrollInCourse = async (courseId: string, token: string) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}/enroll`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const unenrollFromCourse = async (courseId: string, token: string) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}/enroll`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchMyCourses = async (token: string): Promise<{ courses: any[] }> => {
  const response = await fetch(`${baseUrl}/courses/my`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchCourseStudents = async (courseId: string, token: string) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}/students`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== COURSE SECTIONS ==========

export interface CourseSectionData {
  title: string;
  description?: string;
  orderIndex: number;
}

export const createCourseSection = async (
  courseId: string,
  sectionData: CourseSectionData,
  token: string
) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}/sections`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(sectionData), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateCourseSection = async (
  courseId: string,
  sectionId: string,
  sectionData: Partial<CourseSectionData>,
  token: string
) => {
  const response = await fetch(
    `${baseUrl}/courses/${courseId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(sectionData), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const deleteCourseSection = async (
  courseId: string,
  sectionId: string,
  token: string
) => {
  const response = await fetch(
    `${baseUrl}/courses/${courseId}/sections/${sectionId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const fetchCourseLessons = async (courseId: string, token?: string) => {
  const response = await fetch(`${baseUrl}/courses/${courseId}/lessons`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
