import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

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
  const response = await fetch(`${baseUrl}/teachers/me`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const updateTeacherProfile = async (
  data: UpdateTeacherProfileData,
  token: string
) => {
  const response = await fetch(`${baseUrl}/teachers/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

// ========== TEACHER COURSES ==========

export const fetchTeacherCourses = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<any>> => {
  const response = await fetch(`${baseUrl}/teachers/courses?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchTeacherCourseStats = async (courseId: string, token: string) => {
  const response = await fetch(`${baseUrl}/teachers/courses/${courseId}/stats`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
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
  const response = await fetch(`${baseUrl}/teachers/students?page=${page}&limit=${limit}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchTeacherStudentProgress = async (
  studentUserId: string,
  token: string
) => {
  const response = await fetch(`${baseUrl}/teachers/students/${studentUserId}/progress`, {
    headers: getAuthHeaders(token),
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
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchTeacherExamStats = async (examId: string, token: string) => {
  const response = await fetch(`${baseUrl}/teachers/exams/${examId}/stats`, {
    headers: getAuthHeaders(token),
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
    headers: getAuthHeaders(token),
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
      headers: getAuthHeaders(token),
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
    headers: getAuthHeaders(token),
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
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const startLiveClass = async (liveClassId: string, token: string) => {
  const response = await fetch(`${baseUrl}/teachers/live-classes/${liveClassId}/start`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const endLiveClass = async (liveClassId: string, token: string) => {
  const response = await fetch(`${baseUrl}/teachers/live-classes/${liveClassId}/end`, {
    method: 'POST',
    headers: getAuthHeaders(token),
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
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchTeacherEarningsSummary = async (token: string) => {
  const response = await fetch(`${baseUrl}/teachers/earnings/summary`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
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
  const response = await fetch(`${baseUrl}/teachers/analytics`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
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
      headers: getAuthHeaders(token),
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
      headers: getAuthHeaders(token),
    }
  );
  return handleApiError(response);
};
