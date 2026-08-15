import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface Question {
  id: string;
  subjectId?: string;
  topicId?: string;
  questionType: string;
  questionText: string;
  options?: any;
  correctAnswer: any;
  explanation?: string;
  difficulty: string;
  marks?: number;
  examName?: string;
  examYear?: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface QuestionFilters {
  page?: number;
  limit?: number;
  subjectId?: string;
  difficulty?: string;
  questionType?: string;
  search?: string;
}

export const fetchAdminQuestions = async (
  token: string,
  filters: QuestionFilters = {}
): Promise<{ questions: Question[]; pagination: Pagination }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const response = await fetch(`${baseUrl}/questions?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  const body = (await handleApiError(response)) as {
    data?: { questions?: Question[] };
    pagination?: Pagination;
  };
  return { questions: body.data?.questions ?? [], pagination: body.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 } };
};

export const createAdminQuestion = async (
  token: string,
  data: Partial<Question>
): Promise<{ question: Question }> => {
  const response = await fetch(`${baseUrl}/questions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateAdminQuestion = async (
  token: string,
  id: string,
  data: Partial<Question>
): Promise<{ question: Question }> => {
  const response = await fetch(`${baseUrl}/questions/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteAdminQuestion = async (
  token: string,
  id: string
): Promise<void> => {
  const response = await fetch(`${baseUrl}/questions/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
