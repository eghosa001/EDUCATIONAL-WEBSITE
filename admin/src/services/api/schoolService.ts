import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export interface SchoolRow {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  state?: string;
  lga?: string;
  type?: string;
  logo_url?: string;
  status: string;
  student_count?: number;
  teacher_count?: number;
  created_at: string;
  [key: string]: unknown;
}

export interface SchoolFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export const fetchSchools = async (token: string, filters: SchoolFilters = {}): Promise<{ data: { data: SchoolRow[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '50');
  const response = await fetch(`${baseUrl}/schools?${params.toString()}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const fetchSchool = async (token: string, id: string): Promise<{ data: SchoolRow }> => {
  const response = await fetch(`${baseUrl}/schools/${id}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export interface SchoolStats {
  students: number;
  teachers: number;
  classes: number;
  [key: string]: unknown;
}

export const fetchSchoolStats = async (token: string, id: string): Promise<{ data: SchoolStats }> => {
  const response = await fetch(`${baseUrl}/schools/${id}/stats`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const createSchool = async (token: string, data: Record<string, unknown>): Promise<{ data: SchoolRow; message: string }> => {
  const response = await fetch(`${baseUrl}/schools`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const updateSchool = async (token: string, id: string, data: Record<string, unknown>): Promise<{ data: SchoolRow; message: string }> => {
  const response = await fetch(`${baseUrl}/schools/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const deleteSchool = async (token: string, id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/schools/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};
