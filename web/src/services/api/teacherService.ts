import { apiConfig, getAuthHeaders, getLearnerApiHeaders, handleApiError, learnerApiConfig } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;
const teacherEdgeBaseUrl = learnerApiConfig.baseUrl;
const teacherEdgeGet = async <T>(path: string, token: string): Promise<T> => {
  const response = await fetch(`${teacherEdgeBaseUrl}${path}`, {
    headers: getLearnerApiHeaders(token),
    credentials: learnerApiConfig.credentials,
  });
  return handleApiError(response);
};
const teacherEdgePatch = async <T>(path: string, data: Record<string, unknown>, token: string): Promise<T> => {
  const response = await fetch(`${teacherEdgeBaseUrl}${path}`, {
    method: 'PATCH',
    headers: getLearnerApiHeaders(token),
    body: JSON.stringify(data),
    credentials: learnerApiConfig.credentials,
  });
  return handleApiError(response);
};
const normalizePage = <T>(payload: any, key: string): PaginatedResponse<T> => ({
  data: payload?.data?.[key] || [],
  page: Number(payload?.pagination?.page || 1),
  pageSize: Number(payload?.pagination?.limit || 20),
  total: Number(payload?.pagination?.total || 0),
  totalPages: Number(payload?.pagination?.totalPages || 0),
});

// ========== TEACHER PROFILE ==========

export interface TeacherProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  subjectIds: string[];
  schoolId?: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  studentCount: number;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTeacherProfileData {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
  avatar?: string;
  subjectIds?: string[];
}

export const fetchTeacherProfile = async (token: string): Promise<{ teacher: TeacherProfile }> => {
  const payload = await teacherEdgeGet<any>('/teachers/me', token);
  return { teacher: payload.data.teacher };
};

export const updateTeacherProfile = async (
  data: UpdateTeacherProfileData,
  token: string
) => {
  const payload = await teacherEdgePatch<any>('/teachers/me', data as Record<string, unknown>, token);
  return { teacher: payload.data.teacher };
};

// ========== TEACHER COURSES ==========

export const fetchTeacherCourses = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<any>> => {
  const payload = await teacherEdgeGet<any>(`/teachers/courses?page=${page}&limit=${limit}`, token);
  return normalizePage(payload, 'courses');
};

export const fetchTeacherCourseStats = async (courseId: string, token: string) => {
  const payload = await teacherEdgeGet<any>(`/teachers/courses/${courseId}/stats`, token);
  return { stats: payload.data.stats };
};

// ========== TEACHER STUDENTS ==========

export interface TeacherStudent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  enrolledAt: string;
  progressPercentage: number;
  lastActiveAt: string;
}

export const fetchTeacherStudents = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<TeacherStudent>> => {
  const payload = await teacherEdgeGet<any>(`/teachers/students?page=${page}&limit=${limit}`, token);
  return normalizePage<TeacherStudent>(payload, 'students');
};

export const fetchTeacherStudentProgress = async (
  studentUserId: string,
  token: string
) => {
  const response = await fetch(`${baseUrl}/teachers/students/${studentUserId}/progress`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== TEACHER EXAMS ==========

export const fetchTeacherExams = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(`${baseUrl}/teachers/exams?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchTeacherExamStats = async (examId: string, token: string) => {
  const response = await fetch(`${baseUrl}/teachers/exams/${examId}/stats`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== TEACHER ASSIGNMENTS ==========

export interface TeacherAssignment {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  dueDate: string;
  submittedCount: number;
  totalStudents: number;
  createdAt: string;
}

export const fetchTeacherAssignments = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<TeacherAssignment>> => {
  const response = await fetch(`${baseUrl}/teachers/assignments?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchTeacherAssignmentSubmissions = async (
  assignmentId: string,
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(
    `${baseUrl}/teachers/assignments/${assignmentId}/submissions?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

// ========== TEACHER LIVE CLASSES ==========

export interface TeacherLiveClass {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  meetingUrl?: string;
  recordingUrl?: string;
  studentCount: number;
}

export const fetchTeacherLiveClasses = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<TeacherLiveClass>> => {
  const response = await fetch(`${baseUrl}/teachers/live-classes?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const createTeacherLiveClass = async (
  data: {
    title: string;
    courseId: string;
    scheduledAt: string;
    durationMinutes: number;
    description?: string;
  },
  token: string
) => {
  const response = await fetch(`${baseUrl}/teachers/live-classes`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data), credentials: 'include'
  });
  return handleApiError(response);
};

export const startLiveClass = async (liveClassId: string, token: string) => {
  const response = await fetch(`${baseUrl}/teachers/live-classes/${liveClassId}/start`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const endLiveClass = async (liveClassId: string, token: string) => {
  const response = await fetch(`${baseUrl}/teachers/live-classes/${liveClassId}/end`, {
    method: 'POST',
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

// ========== TEACHER EARNINGS ==========

export interface TeacherEarning {
  id: string;
  amount: number;
  currency: string;
  source: 'course_sale' | 'subscription' | 'bonus' | 'referral';
  description: string;
  status: 'pending' | 'paid' | 'failed';
  paidAt?: string;
  createdAt: string;
}

export const fetchTeacherEarnings = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<TeacherEarning>> => {
  const response = await fetch(`${baseUrl}/teachers/earnings?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const fetchTeacherEarningsSummary = async (token: string) => {
  const payload = await teacherEdgeGet<any>('/teachers/earnings/summary', token);
  return { summary: payload.data.summary };
};

// ========== TEACHER ANALYTICS ==========

export interface TeacherAnalytics {
  totalStudents: number;
  totalCourses: number;
  totalLessons: number;
  totalExams: number;
  averageCourseRating: number;
  averageStudentProgress: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export const fetchTeacherAnalytics = async (token: string): Promise<{ analytics: TeacherAnalytics }> => {
  const payload = await teacherEdgeGet<any>('/teachers/analytics', token);
  return { analytics: payload.data.analytics };
};

// ========== TEACHER NOTIFICATIONS ==========

export interface TeacherNotification {
  id: string;
  type: 'new_student' | 'course_review' | 'exam_submission' | 'assignment_submission' | 'payment';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export const fetchTeacherNotifications = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<TeacherNotification>> => {
  const response = await fetch(
    `${baseUrl}/teachers/notifications?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};

export const markTeacherNotificationAsRead = async (
  notificationId: string,
  token: string
) => {
  const response = await fetch(
    `${baseUrl}/teachers/notifications/${notificationId}/read`,
    {
      method: 'POST',
      headers: getAuthHeaders(token), credentials: 'include'
    }
  );
  return handleApiError(response);
};
