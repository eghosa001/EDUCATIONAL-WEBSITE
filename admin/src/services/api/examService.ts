import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface AdminExam {
  id: string;
  title: string;
  slug: string;
  description?: string;
  examType: string;
  subjectId?: string;
  classId?: string;
  durationMinutes?: number;
  totalMarks?: number;
  passingMarks?: number;
  instructions?: string;
  startTime?: string;
  endTime?: string;
  isTimed: boolean;
  shuffleQuestions?: boolean;
  showResultsImmediately?: boolean;
  allowReview?: boolean;
  maxAttempts?: number;
  isActive: boolean;
  isPublic?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamFilters {
  page?: number;
  limit?: number;
  examType?: string;
  isPublic?: boolean;
}

export const fetchAdminExams = async (
  token: string,
  filters: ExamFilters = {}
): Promise<{ exams: AdminExam[]; pagination: Pagination }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await fetch(`${baseUrl}/exams?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  const body = (await handleApiError(response)) as {
    data?: { exams?: AdminExam[] };
    pagination?: Pagination;
  };
  return { exams: body.data?.exams ?? [], pagination: body.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 } };
};

export const createAdminExam = async (
  token: string,
  data: Partial<AdminExam>
): Promise<{ exam: AdminExam }> => {
  const response = await fetch(`${baseUrl}/exams`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateAdminExam = async (
  token: string,
  id: string,
  data: Partial<AdminExam>
): Promise<{ exam: AdminExam }> => {
  const response = await fetch(`${baseUrl}/exams/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const publishAdminExam = async (
  token: string,
  id: string
): Promise<{ exam: AdminExam }> => {
  const response = await fetch(`${baseUrl}/exams/${id}/publish`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const deleteAdminExam = async (
  token: string,
  id: string
): Promise<void> => {
  const response = await fetch(`${baseUrl}/exams/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchAdminExamQuestions = async (
  token: string,
  examId: string
): Promise<{ questions: any[] }> => {
  const response = await fetch(`${baseUrl}/exams/${examId}/questions`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const addQuestionToExam = async (
  token: string,
  examId: string,
  data: { questionId: string; orderIndex?: number; marks?: number; sectionName?: string }
): Promise<any> => {
  const response = await fetch(`${baseUrl}/exams/${examId}/questions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};
