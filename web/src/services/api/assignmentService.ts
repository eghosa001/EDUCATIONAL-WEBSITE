import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  content?: string;
  fileUrls?: string[];
  status: 'submitted' | 'graded' | 'late';
  score?: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  isLate: boolean;
  submittedAt: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  teacherId?: string;
  title: string;
  description?: string;
  instructions?: string;
  assignmentType: string;
  maxScore: number;
  dueDate: string;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const fetchAssignments = async (
  filters: { page?: number; limit?: number; courseId?: string } = {},
  token?: string
): Promise<{ data: Assignment[]; pagination?: any }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  const response = await fetch(`${baseUrl}/assignments?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchMyAssignments = async (
  token: string,
  courseId?: string
): Promise<{ assignments: Assignment[] }> => {
  const params = new URLSearchParams();
  if (courseId) params.append('courseId', courseId);
  const response = await fetch(`${baseUrl}/assignments?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchMySubmissions = async (
  token: string,
  page = 1,
  limit = 20
): Promise<{ submissions: AssignmentSubmission[]; pagination: any }> => {
  const response = await fetch(
    `${baseUrl}/assignments/my-submissions?page=${page}&limit=${limit}`,
    { headers: getAuthHeaders(token) }
  );
  return handleApiError(response);
};

export const fetchAssignmentById = async (
  assignmentId: string,
  token: string
): Promise<{ assignment: Assignment }> => {
  const response = await fetch(`${baseUrl}/assignments/${assignmentId}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const submitAssignment = async (
  assignmentId: string,
  data: { content: string; fileUrls?: string[] },
  token: string
): Promise<{ submission: AssignmentSubmission }> => {
  const response = await fetch(`${baseUrl}/assignments/${assignmentId}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const gradeSubmission = async (
  assignmentId: string,
  submissionId: string,
  data: { score: number; feedback: string },
  token: string
): Promise<{ submission: AssignmentSubmission }> => {
  const response = await fetch(
    `${baseUrl}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
    {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(data),
    }
  );
  return handleApiError(response);
};

export const fetchAssignmentSubmissions = async (
  assignmentId: string,
  token: string
): Promise<{ submissions: AssignmentSubmission[] }> => {
  const response = await fetch(`${baseUrl}/assignments/${assignmentId}/submissions`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
