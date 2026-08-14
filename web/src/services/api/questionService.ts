import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Question } from '@/types/models/question';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== QUESTIONS ==========

export interface QuestionFilters {
  page?: number;
  limit?: number;
  subjectId?: string;
  topicId?: string;
  classId?: string;
  difficulty?: string;
  questionType?: string;
  examName?: string;
  examYear?: number;
  search?: string;
}

export interface BulkQuestionImport {
  questions: Partial<Question>[];
}

export const fetchQuestions = async (
  filters: QuestionFilters = {},
  token?: string
): Promise<PaginatedResponse<Question>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/questions?${query.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchQuestionById = async (questionId: string, token?: string): Promise<{ question: Question }> => {
  const response = await fetch(`${baseUrl}/questions/${questionId}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const createQuestion = async (questionData: Partial<Question>, token: string) => {
  const response = await fetch(`${baseUrl}/questions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(questionData),
  });
  return handleApiError(response);
};

export const bulkImportQuestions = async (
  importData: BulkQuestionImport,
  token: string
) => {
  const response = await fetch(`${baseUrl}/questions/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(importData),
  });
  return handleApiError(response);
};

export const updateQuestion = async (
  questionId: string,
  questionData: Partial<Question>,
  token: string
) => {
  const response = await fetch(`${baseUrl}/questions/${questionId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(questionData),
  });
  return handleApiError(response);
};

export const reviewQuestion = async (questionId: string, token: string) => {
  const response = await fetch(`${baseUrl}/questions/${questionId}/review`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const deleteQuestion = async (questionId: string, token: string) => {
  const response = await fetch(`${baseUrl}/questions/${questionId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== PAST QUESTIONS ==========

export interface PastQuestionFilters {
  page?: number;
  limit?: number;
  subjectId?: string;
  classId?: string;
  examName?: string;
  examYear?: number;
}

export const fetchPastQuestions = async (
  filters: PastQuestionFilters = {},
  token?: string
) => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/library/past-questions?${query.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchPastQuestionExams = async (token?: string) => {
  const response = await fetch(`${baseUrl}/library/past-questions/exams`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
