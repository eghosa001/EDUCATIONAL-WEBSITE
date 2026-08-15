import { apiConfig, getAuthHeaders, handleApiError } from './config';

const { baseUrl } = apiConfig;

export interface UserProfile {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar_url?: string;
  avatarUrl?: string;
  phone?: string;
  is_verified?: boolean;
  is_active?: boolean;
  taught_courses?: number;
  taughtCourses?: number;
  enrolled_courses?: number;
  enrolledCourses?: number;
  created_at?: string;
  createdAt?: string;
  [key: string]: unknown;
}

export const fetchUserProfile = async (token: string, userId: string): Promise<{ data: { profile: UserProfile } }> => {
  const response = await fetch(`${baseUrl}/users/${userId}/profile`, { headers: getAuthHeaders(token) });
  return handleApiError(response);
};

export const verifyTeacher = async (token: string, userId: string, verified: boolean): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${baseUrl}/users/${userId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ isVerified: verified }),
  });
  return handleApiError(response);
};
