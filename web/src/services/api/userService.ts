import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { User } from '@/types/models/user';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== USERS ==========

export interface UserFilters {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  bio?: string;
  phone?: string;
}

export const fetchUsers = async (
  filters: UserFilters = {},
  token: string
): Promise<PaginatedResponse<User>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/users?${query.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchUserById = async (userId: string, token: string): Promise<{ user: User }> => {
  const response = await fetch(`${baseUrl}/users/${userId}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const updateUser = async (
  userId: string,
  userData: UpdateUserData,
  token: string
) => {
  const response = await fetch(`${baseUrl}/users/${userId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(userData),
  });
  return handleApiError(response);
};

export const deleteUser = async (userId: string, token: string) => {
  const response = await fetch(`${baseUrl}/users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== PROFILE ==========

export const fetchMyProfile = async (token: string): Promise<{ user: User }> => {
  const response = await fetch(`${baseUrl}/users/me`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const updateMyProfile = async (userData: UpdateUserData, token: string) => {
  const response = await fetch(`${baseUrl}/users/me`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(userData),
  });
  return handleApiError(response);
};
