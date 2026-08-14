import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Lesson, LessonResource } from '@/types/models/lesson';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== LESSONS ==========

export interface LessonFilters {
  page?: number;
  limit?: number;
  courseId?: string;
  sectionId?: string;
  topicId?: string;
  isPublished?: boolean;
}

export interface LessonProgress {
  status: 'not_started' | 'in_progress' | 'completed' | 'paused';
  progressPercentage: number;
  watchTimeSeconds: number;
  lastPositionSeconds: number;
}

export const fetchLessons = async (
  filters: LessonFilters = {},
  token?: string
): Promise<PaginatedResponse<Lesson>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/lessons?${query.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchLessonByIdOrSlug = async (
  idOrSlug: string,
  courseId?: string,
  token?: string
) => {
  const url = courseId
    ? `${baseUrl}/lessons/${idOrSlug}?courseId=${courseId}`
    : `${baseUrl}/lessons/${idOrSlug}`;
  const response = await fetch(url, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const createLesson = async (lessonData: Partial<Lesson>, token: string) => {
  const response = await fetch(`${baseUrl}/lessons`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(lessonData),
  });
  return handleApiError(response);
};

export const updateLesson = async (
  lessonId: string,
  lessonData: Partial<Lesson>,
  token: string
) => {
  const response = await fetch(`${baseUrl}/lessons/${lessonId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(lessonData),
  });
  return handleApiError(response);
};

export const publishLesson = async (lessonId: string, token: string) => {
  const response = await fetch(`${baseUrl}/lessons/${lessonId}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const deleteLesson = async (lessonId: string, token: string) => {
  const response = await fetch(`${baseUrl}/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const markLessonComplete = async (lessonId: string, token: string) => {
  const response = await fetch(`${baseUrl}/lessons/${lessonId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== LESSON RESOURCES ==========

export interface LessonResourceData {
  title: string;
  resourceType: 'video' | 'document' | 'image' | 'audio' | 'archive' | 'other';
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  description?: string;
  isDownloadable?: boolean;
  orderIndex?: number;
}

export const fetchLessonResources = async (lessonId: string, token: string) => {
  const response = await fetch(`${baseUrl}/lessons/${lessonId}/resources`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const createLessonResource = async (
  lessonId: string,
  resourceData: LessonResourceData,
  token: string
) => {
  const response = await fetch(`${baseUrl}/lessons/${lessonId}/resources`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(resourceData),
  });
  return handleApiError(response);
};

export const deleteLessonResource = async (
  lessonId: string,
  resourceId: string,
  token: string
) => {
  const response = await fetch(
    `${baseUrl}/lessons/${lessonId}/resources/${resourceId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    }
  );
  return handleApiError(response);
};

// ========== LESSON PROGRESS ==========

export const updateLessonProgress = async (
  courseId: string,
  lessonId: string,
  progressData: LessonProgress,
  token: string
) => {
  const response = await fetch(
    `${baseUrl}/progress/courses/${courseId}/lessons/${lessonId}`,
    {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify(progressData),
    }
  );
  return handleApiError(response);
};

export const completeLessonProgress = async (
  courseId: string,
  lessonId: string,
  token: string
) => {
  const response = await fetch(
    `${baseUrl}/progress/courses/${courseId}/lessons/${lessonId}/complete`,
    {
      method: 'POST',
      headers: getAuthHeaders(token),
    }
  );
  return handleApiError(response);
};
