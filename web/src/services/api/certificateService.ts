import { apiConfig, getAuthHeaders, handleApiError } from './config';

const { baseUrl } = apiConfig;

export interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  certificateId: string;
  issuedAt: string;
  studentName: string;
  studentId: string;
  verificationCode?: string;
}

export const fetchMyCertificates = async (token: string): Promise<{ data: Certificate[] }> => {
  const response = await fetch(`${baseUrl}/certificates/my`, {
    headers: getAuthHeaders(token), credentials: 'include'
  });
  return handleApiError(response);
};

export const verifyCertificate = async (certificateId: string, token?: string) => {
  const response = await fetch(`${baseUrl}/certificates/verify/${certificateId}`, {
    headers: token ? getAuthHeaders(token) : undefined,
  });
  return handleApiError(response);
};
