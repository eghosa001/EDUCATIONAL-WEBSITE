import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

const parse = async <T>(response: Response): Promise<T> => handleApiError(response) as Promise<T>;

const unwrapData = async <T>(response: Response): Promise<T> => {
  const payload = await parse<{ data: T }>(response);
  return payload.data;
};

const unwrapPage = async <T>(response: Response, key: string): Promise<PaginatedResponse<T>> => {
  const payload = await parse<{
    data: Record<string, T[]>;
    pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
  }>(response);
  const pagination = payload.pagination || {};
  return {
    data: payload.data?.[key] || [],
    page: Number(pagination.page || 1),
    pageSize: Number(pagination.limit || 20),
    total: Number(pagination.total || 0),
    totalPages: Number(pagination.totalPages || 0),
  };
};

export interface ParentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  occupation?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateParentProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  occupation?: string;
  address?: string;
}

export const fetchParentProfile = async (token: string): Promise<{ parent: ParentProfile }> => {
  const response = await fetch(`${baseUrl}/parents/me`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapData(response);
};

export const updateParentProfile = async (data: UpdateParentProfileData, token: string): Promise<{ parent: ParentProfile }> => {
  const response = await fetch(`${baseUrl}/parents/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return unwrapData(response);
};

export interface Child {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  schoolId?: string;
  classId?: string;
  relationship?: string;
  joinedAt: string;
}

export interface ChildPerformance {
  userId: string;
  studyTimeSeconds: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  examsTaken: number;
  averageExamScore: number;
  currentStreak: number;
  lastActiveAt: string | null;
}

export const fetchParentChildren = async (token: string): Promise<{ children: Child[] }> => {
  const response = await fetch(`${baseUrl}/parents/children`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapData(response);
};

export const addChild = async (childUserId: string, token: string) => {
  const response = await fetch(`${baseUrl}/parents/children`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId: childUserId }),
    credentials: 'include',
  });
  return unwrapData<{ link: unknown; child: unknown }>(response);
};

export const removeChild = async (childUserId: string, token: string) => {
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return parse<{ success: boolean; message: string }>(response);
};

export const fetchChildPerformance = async (childUserId: string, token: string): Promise<{ performance: ChildPerformance }> => {
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}/performance`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapData(response);
};

export const fetchChildCourses = async (
  childUserId: string,
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}/courses?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapPage(response, 'courses');
};

export const fetchChildExams = async (
  childUserId: string,
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}/exams?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapPage(response, 'exams');
};

export const fetchChildProgress = async (childUserId: string, token: string): Promise<{ progress: any }> => {
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}/progress`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapData(response);
};

export interface ChildStudyTime {
  date: string;
  studyTimeSeconds: number;
  coursesStudied: string[];
}

export const fetchChildStudyTime = async (
  childUserId: string,
  token: string,
  startDate?: string,
  endDate?: string
): Promise<{ studyTime: ChildStudyTime[] }> => {
  const query = new URLSearchParams();
  if (startDate) query.append('startDate', startDate);
  if (endDate) query.append('endDate', endDate);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}/study-time${suffix}`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapData(response);
};

export interface ParentNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  actionUrl?: string;
  channel?: string;
  sentAt?: string;
  createdAt: string;
}

export const fetchParentNotifications = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<ParentNotification>> => {
  const response = await fetch(`${baseUrl}/parents/notifications?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapPage(response, 'notifications');
};

export const markParentNotificationAsRead = async (notificationId: string, token: string) => {
  const response = await fetch(`${baseUrl}/parents/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapData<{ notification: ParentNotification }>(response);
};

export interface ParentReport {
  id: string;
  childId: string | null;
  childName: string | null;
  type: 'weekly' | 'monthly' | 'exam' | 'progress';
  data: Record<string, unknown>;
  generatedAt: string;
  status?: string;
  fileUrl?: string | null;
}

export const fetchParentReports = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<ParentReport>> => {
  const response = await fetch(`${baseUrl}/parents/reports?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return unwrapPage(response, 'reports');
};

export const generateParentReport = async (
  childUserId: string,
  reportType: 'weekly' | 'monthly' | 'exam' | 'progress',
  token: string
) => {
  const response = await fetch(`${baseUrl}/parents/reports`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ childId: childUserId, reportType }),
    credentials: 'include',
  });
  return unwrapData<{ report: ParentReport }>(response);
};

export const downloadParentReport = async (reportId: string, token: string) => {
  const response = await fetch(`${baseUrl}/parents/reports/${reportId}/download`, {
    headers: getAuthHeaders(token),
    credentials: 'include',
  });
  return response;
};
