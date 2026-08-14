import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== STUDENT PROGRESS ==========

export interface StudentOverview {
  enrolledCourses: number;
  completedLessons: number;
  totalStudyTimeSeconds: number;
  averageCourseProgress: number;
  examsTaken: number;
  averageExamScore: number;
}

export interface CourseProgress {
  courseId: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  lastAccessedAt?: string;
  completedAt?: string;
  lessons: any[];
}

export interface StudySession {
  id: string;
  studentId: string;
  courseId?: string;
  lessonId?: string;
  activityType: 'watching' | 'reading' | 'quizzing' | 'revising' | 'other';
  metadata?: Record<string, unknown>;
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface StudySessionData {
  courseId?: string;
  lessonId?: string;
  activityType: 'watching' | 'reading' | 'quizzing' | 'revising' | 'other';
  metadata?: Record<string, unknown>;
}

export const fetchStudentOverview = async (token: string): Promise<{ overview: StudentOverview }> => {
  const response = await fetch(`${baseUrl}/progress/overview`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchCourseProgress = async (
  courseId: string,
  token: string
): Promise<{ progress: CourseProgress }> => {
  const response = await fetch(`${baseUrl}/progress/courses/${courseId}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== STUDY SESSIONS ==========

export const startStudySession = async (
  sessionData: StudySessionData,
  token: string
): Promise<{ session: StudySession }> => {
  const response = await fetch(`${baseUrl}/progress/sessions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(sessionData),
  });
  return handleApiError(response);
};

export const endStudySession = async (sessionId: string, token: string): Promise<{ session: StudySession }> => {
  const response = await fetch(`${baseUrl}/progress/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchStudySessions = async (
  page: number = 1,
  limit: number = 20,
  token: string
): Promise<PaginatedResponse<StudySession>> => {
  const response = await fetch(
    `${baseUrl}/progress/sessions?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(token),
    }
  );
  return handleApiError(response);
};
