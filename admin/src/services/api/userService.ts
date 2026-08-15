import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';
import type { UserRole } from '@/types/models/user';

const { baseUrl } = apiConfig;

export interface AdminUserRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  avatarUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: string[];
}

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

export const fetchUsers = async (token: string, filters: UserFilters = {}): Promise<{ data: { users: AdminUserRow[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '50');
  const response = await fetch(`${baseUrl}/users?${params.toString()}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const fetchUser = async (token: string, id: string): Promise<{ data: { user: AdminUserRow & { roles: string[]; permissions: unknown } } }> => {
  const response = await fetch(`${baseUrl}/users/${id}`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const deactivateUser = async (token: string, id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/users/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const assignRole = async (token: string, id: string, roleId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/users/${id}/roles`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ roleId }),
  });
  return handleApiError(response);
};

export const removeRole = async (token: string, id: string, roleId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/users/${id}/roles/${roleId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const isRole = (user: AdminUserRow, role: UserRole): boolean => user.roles?.includes(role) ?? false;
