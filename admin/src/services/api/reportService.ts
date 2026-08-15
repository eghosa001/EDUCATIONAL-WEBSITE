import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface ReportRow {
  id: string;
  userId: string;
  type: string;
  title?: string;
  description?: string;
  filters?: Record<string, unknown>;
  data?: unknown;
  createdAt: string;
  [key: string]: unknown;
}

export const fetchReports = async (token: string, page = 1, limit = 50): Promise<{ data: { reports: ReportRow[] }; pagination: Pagination }> => {
  const response = await fetch(`${baseUrl}/reports?page=${page}&limit=${limit}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export type ReportType = 'user_summary' | 'revenue_summary' | 'content_summary' | 'exam_performance' | 'subscriptions_summary' | 'teacher_earnings';

export const createReport = async (
  token: string,
  data: { type: ReportType; title?: string; description?: string; filters?: Record<string, unknown> }
): Promise<{ data: { report: ReportRow; data: unknown } }> => {
  const response = await fetch(`${baseUrl}/reports`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteReport = async (token: string, id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/reports/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
