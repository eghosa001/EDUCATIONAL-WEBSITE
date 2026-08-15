import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalSchools: number;
  activeToday: number;
  courses: number;
  lessons: number;
  questions: number;
  exams: number;
  subscribers: number;
  monthlyRevenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentUsers: Array<{ id: string; email: string; firstName: string; lastName: string; role: string; createdAt: string }>;
  popularSubjects: Array<{ name: string; code: string; enrollments: number }>;
  pendingContent: { coursesPendingReview: number; lessonsUnpublished: number };
}

export const fetchDashboard = async (token: string): Promise<{ data: DashboardData }> => {
  const response = await fetch(`${baseUrl}/admin/dashboard`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes: unknown;
  ipAddress: string;
  userAgent: string;
  metadata: unknown;
  createdAt: string;
}

export const fetchAuditLogs = async (token: string, page = 1, limit = 20): Promise<{ data: { logs: AuditLog[] }; pagination: Pagination }> => {
  const response = await fetch(`${baseUrl}/admin/audit-logs?page=${page}&limit=${limit}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export interface Setting {
  key: string;
  value: string;
  updatedBy: string;
  updatedAt: string;
}

export const fetchSettings = async (token: string): Promise<{ data: { settings: Setting[] } }> => {
  const response = await fetch(`${baseUrl}/admin/settings`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const updateSettings = async (
  token: string,
  updates: Array<{ key: string; value: string | number | boolean }>
): Promise<{ data: { settings: Setting[] } }> => {
  const response = await fetch(`${baseUrl}/admin/settings`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ updates }),
  });
  return handleApiError(response);
};

export interface PendingCourse {
  id: string;
  title: string;
  slug: string;
  status: string;
  teacher: { firstName: string; lastName: string; email: string };
  updatedAt: string;
}

export interface PendingLesson {
  id: string;
  title: string;
  slug: string;
  courseTitle: string;
  teacher: { firstName: string; lastName: string };
  updatedAt: string;
}

export const fetchPendingContent = async (token: string): Promise<{ data: { courses: PendingCourse[]; lessons: PendingLesson[] } }> => {
  const response = await fetch(`${baseUrl}/admin/content/pending`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const approveContent = async (token: string, type: 'course' | 'lesson', id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/admin/content/${type}/${id}/approve`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ type }),
  });
  return handleApiError(response);
};

export const rejectContent = async (token: string, type: 'course' | 'lesson', id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/admin/content/${type}/${id}/reject`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ type }),
  });
  return handleApiError(response);
};

export interface ModerationPost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export const fetchModerationPosts = async (token: string, page = 1, limit = 20): Promise<{ data: { posts: ModerationPost[] }; pagination: Pagination }> => {
  const response = await fetch(`${baseUrl}/admin/moderation/posts?page=${page}&limit=${limit}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const hidePost = async (token: string, postId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/admin/moderation/posts/${postId}/hide`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const unhidePost = async (token: string, postId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/admin/moderation/posts/${postId}/unhide`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
