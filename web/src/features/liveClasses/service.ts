import { apiConfig, getAuthHeaders, handleApiError } from '@/services/api/config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

export interface LiveClass {
  id: string;
  title: string;
  description?: string;
  subjectTitle?: string;
  teacherName?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  meetingUrl?: string;
  studentCount?: number;
}

export interface LiveClassFilters {
  page?: number;
  limit?: number;
  status?: string;
  subjectId?: string;
  teacherId?: string;
  search?: string;
}

export interface CreateLiveClassInput {
  title: string;
  description?: string;
  subjectId?: string;
  topicId?: string;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants?: number;
  meetingUrl: string;
}

export const fetchLiveClasses = async (
  filters: LiveClassFilters = {},
  token?: string
): Promise<PaginatedResponse<LiveClass>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') query.append(key, String(value));
  });
  const response = await fetch(`${baseUrl}/live-classes?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchMyLiveClasses = async (
  token: string,
  filters: { page?: number; limit?: number; status?: string } = {}
): Promise<PaginatedResponse<LiveClass>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) query.append(key, String(value));
  });
  const response = await fetch(`${baseUrl}/live-classes/my?${query.toString()}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createLiveClass = async (data: CreateLiveClassInput, token: string): Promise<{ data: LiveClass }> => {
  const response = await fetch(`${baseUrl}/live-classes`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
    credentials: 'include'
  });
  return handleApiError(response);
};

export const getLiveClass = async (id: string, token?: string): Promise<{ data: LiveClass }> => {
  const response = await fetch(`${baseUrl}/live-classes/${id}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const joinLiveClass = async (id: string, token: string): Promise<{ data: { meetingUrl: string } }> => {
  const response = await fetch(`${baseUrl}/live-classes/${id}/join`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const leaveLiveClass = async (id: string, token: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${baseUrl}/live-classes/${id}/leave`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
