import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== GLOBAL SEARCH ==========

export interface SearchResult {
  type: 'course' | 'lesson' | 'question' | 'exam' | 'teacher' | 'video' | 'pdf' | 'past_question' | 'topic';
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface SearchFilters {
  query: string;
  page?: number;
  limit?: number;
  type?: string;
  subjectId?: string;
  classId?: string;
}

export const globalSearch = async (
  filters: SearchFilters,
  token?: string
): Promise<PaginatedResponse<SearchResult>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/search?${query.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== COURSE SEARCH ==========

export const searchCourses = async (
  query: string,
  filters: { subjectId?: string; classId?: string; page?: number; limit?: number } = {},
  token?: string
): Promise<PaginatedResponse<any>> => {
  const params = new URLSearchParams({ query });
  if (filters.subjectId) params.append('subjectId', filters.subjectId);
  if (filters.classId) params.append('classId', filters.classId);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${baseUrl}/search/courses?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== LESSON SEARCH ==========

export const searchLessons = async (
  query: string,
  filters: { courseId?: string; subjectId?: string; page?: number; limit?: number } = {},
  token?: string
): Promise<PaginatedResponse<any>> => {
  const params = new URLSearchParams({ query });
  if (filters.courseId) params.append('courseId', filters.courseId);
  if (filters.subjectId) params.append('subjectId', filters.subjectId);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${baseUrl}/search/lessons?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== QUESTION SEARCH ==========

export const searchQuestions = async (
  query: string,
  filters: { subjectId?: string; topicId?: string; difficulty?: string; page?: number; limit?: number } = {},
  token?: string
): Promise<PaginatedResponse<any>> => {
  const params = new URLSearchParams({ query });
  if (filters.subjectId) params.append('subjectId', filters.subjectId);
  if (filters.topicId) params.append('topicId', filters.topicId);
  if (filters.difficulty) params.append('difficulty', filters.difficulty);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${baseUrl}/search/questions?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== PAST QUESTIONS SEARCH ==========

export const searchPastQuestions = async (
  query: string,
  filters: { examName?: string; subjectId?: string; year?: number; page?: number; limit?: number } = {},
  token?: string
): Promise<PaginatedResponse<any>> => {
  const params = new URLSearchParams({ query });
  if (filters.examName) params.append('examName', filters.examName);
  if (filters.subjectId) params.append('subjectId', filters.subjectId);
  if (filters.year) params.append('year', String(filters.year));
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));

  const response = await fetch(`${baseUrl}/search/past-questions?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== SEARCH SUGGESTIONS ==========

export const fetchSearchSuggestions = async (query: string, token?: string): Promise<{ suggestions: string[] }> => {
  const response = await fetch(`${baseUrl}/search/suggestions?query=${encodeURIComponent(query)}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== POPULAR SEARCHES ==========

export const fetchPopularSearches = async (token?: string): Promise<{ searches: Array<{ query: string; count: number }> }> => {
  const response = await fetch(`${baseUrl}/search/popular`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
