import { apiConfig, handleApiError } from './config';
import type { User } from '@/types/models/user';

const { baseUrl } = apiConfig;

// ========== AUTHENTICATION ==========

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'student' | 'teacher' | 'parent';
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: { id: string; email: string; firstName: string; lastName: string; isVerified: boolean };
    tokens: { accessToken: string; refreshToken: string };
  };
}

export interface TokenResponse {
  success: boolean;
  data: { tokens: { accessToken: string; refreshToken: string } };
}

export interface AuthMessageResponse {
  success: boolean;
  message: string;
}

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    credentials: 'include',
  });
  return handleApiError(response);
};

export const register = async (data: RegisterData): Promise<RegisterResponse> => {
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return handleApiError(response);
};

export const logout = async (token: string) => {
  const response = await fetch(`${baseUrl}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  return handleApiError(response);
};

export const refreshToken = async (refreshToken: string): Promise<TokenResponse> => {
  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  return handleApiError(response);
};

export const forgotPassword = async (data: { email: string }): Promise<AuthMessageResponse> => {
  const response = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const resetPassword = async (data: { token: string; password: string }): Promise<AuthMessageResponse> => {
  const response = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }, token: string) => {
  const response = await fetch(`${baseUrl}/auth/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return handleApiError(response);
};

export const verifyEmail = async (userId: string, token: string) => {
  const response = await fetch(`${baseUrl}/auth/verify-email/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  return handleApiError(response);
};

export const resendVerification = async (token: string) => {
  const response = await fetch(`${baseUrl}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  return handleApiError(response);
};

export const getCurrentUser = async (token: string) => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${baseUrl}/auth/me`, {
    headers,
    credentials: 'include',
  });
  return handleApiError(response);
};
