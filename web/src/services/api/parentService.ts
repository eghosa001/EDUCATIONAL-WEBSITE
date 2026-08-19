import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== PARENT PROFILE ==========

export interface ParentProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  studentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateParentProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export const fetchParentProfile = async (token: string): Promise<{ parent: ParentProfile }> => {
  const response = await fetch(`${baseUrl}/parents/me`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const updateParentProfile = async (
  data: UpdateParentProfileData,
  token: string
) => {
  const response = await fetch(`${baseUrl}/parents/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== CHILDREN ==========

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
  lastActiveAt: string;
}

export const fetchParentChildren = async (token: string): Promise<{ children: Child[] }> => {
  const response = await fetch(`${baseUrl}/parents/children`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const addChild = async (childUserId: string, token: string) => {
  const response = await fetch(`${baseUrl}/parents/children`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId: childUserId, credentials: 'include' }),
  });
  return handleApiError(response);
};

export const removeChild = async (childUserId: string, token: string) => {
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== CHILD PERFORMANCE ==========

export const fetchChildPerformance = async (
  childUserId: string,
  token: string
): Promise<{ performance: ChildPerformance }> => {
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}/performance`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchChildCourses = async (
  childUserId: string,
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(
    `${baseUrl}/parents/children/${childUserId}/courses?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const fetchChildExams = async (
  childUserId: string,
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(
    `${baseUrl}/parents/children/${childUserId}/exams?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const fetchChildProgress = async (
  childUserId: string,
  token: string
): Promise<{ progress: any }> => {
  const response = await fetch(`${baseUrl}/parents/children/${childUserId}/progress`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== CHILD STUDY TIME ==========

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

  const response = await fetch(
    `${baseUrl}/parents/children/${childUserId}/study-time?${query.toString()}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

// ========== PARENT NOTIFICATIONS ==========

export interface ParentNotification {
  id: string;
  childId: string;
  childName: string;
  type: 'exam_result' | 'course_completion' | 'new_assignment' | 'low_performance' | 'attendance';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export const fetchParentNotifications = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<ParentNotification>> => {
  const response = await fetch(
    `${baseUrl}/parents/notifications?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const markParentNotificationAsRead = async (
  notificationId: string,
  token: string
) => {
  const response = await fetch(
    `${baseUrl}/parents/notifications/${notificationId}/read`,
    {
      method: 'POST',
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

// ========== PARENT REPORTS ==========

export interface ParentReport {
  id: string;
  childId: string;
  childName: string;
  type: 'weekly' | 'monthly' | 'exam' | 'progress';
  data: Record<string, unknown>;
  generatedAt: string;
}

export const fetchParentReports = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<ParentReport>> => {
  const response = await fetch(
    `${baseUrl}/parents/reports?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const generateParentReport = async (
  childUserId: string,
  reportType: 'weekly' | 'monthly' | 'exam' | 'progress',
  token: string
) => {
  const response = await fetch(`${baseUrl}/parents/reports`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ childId: childUserId, reportType, credentials: 'include' }),
  });
  return handleApiError(response);
};

export const downloadParentReport = async (reportId: string, token: string) => {
  const response = await fetch(`${baseUrl}/parents/reports/${reportId}/download`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};
