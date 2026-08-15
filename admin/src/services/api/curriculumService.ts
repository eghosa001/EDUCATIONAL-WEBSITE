import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface SubjectRow {
  id: string;
  education_system_id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  order_index: number;
  is_core: boolean;
  is_active: boolean;
  created_at: string;
  topics_count?: number;
  courses_count?: number;
  [key: string]: unknown;
}

export interface TopicRow {
  id: string;
  subject_id: string;
  class_id?: string;
  term_id?: string;
  name: string;
  code: string;
  description?: string;
  learning_objectives?: string[];
  order_index: number;
  estimated_hours?: number;
  is_active: boolean;
  created_at: string;
  subtopics_count?: number;
  [key: string]: unknown;
}

export interface SubjectFilters {
  page?: number;
  limit?: number;
  educationSystemId?: string;
  classId?: string;
  levelCode?: string;
}

export interface TopicFilters {
  page?: number;
  limit?: number;
  subjectId?: string;
  classId?: string;
  termId?: string;
  levelCode?: string;
}

export const fetchSubjects = async (token: string, filters: SubjectFilters = {}): Promise<{ data: { subjects: SubjectRow[] }; pagination: Pagination }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '100');
  const response = await fetch(`${baseUrl}/curriculum/subjects?${params.toString()}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const createSubject = async (token: string, data: Record<string, unknown>): Promise<{ data: { subject: SubjectRow } }> => {
  const response = await fetch(`${baseUrl}/curriculum/subjects`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateSubject = async (token: string, id: string, data: Record<string, unknown>): Promise<{ data: { subject: SubjectRow } }> => {
  const response = await fetch(`${baseUrl}/curriculum/subjects/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteSubject = async (token: string, id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/curriculum/subjects/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchTopics = async (token: string, filters: TopicFilters = {}): Promise<{ data: { topics: TopicRow[] }; pagination: Pagination }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '100');
  const response = await fetch(`${baseUrl}/curriculum/topics?${params.toString()}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const createTopic = async (token: string, data: Record<string, unknown>): Promise<{ data: { topic: TopicRow } }> => {
  const response = await fetch(`${baseUrl}/curriculum/topics`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateTopic = async (token: string, id: string, data: Record<string, unknown>): Promise<{ data: { topic: TopicRow } }> => {
  const response = await fetch(`${baseUrl}/curriculum/topics/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteTopic = async (token: string, id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/curriculum/topics/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchEducationSystems = async (token: string): Promise<{ data: { educationSystems: Array<{ id: string; name: string; code: string }> } }> => {
  const response = await fetch(`${baseUrl}/curriculum/education-systems`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const fetchEducationLevels = async (token: string): Promise<{ data: { educationLevels: Array<{ id: string; education_system_id: string; name: string; code: string; order_index: number }> } }> => {
  const response = await fetch(`${baseUrl}/curriculum/education-levels`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};
