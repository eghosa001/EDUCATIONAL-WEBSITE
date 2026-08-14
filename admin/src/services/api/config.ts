const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const apiConfig = {
  baseUrl: API_BASE_URL,
  headers: DEFAULT_HEADERS,
  timeout: 10000,
};

export const getAuthHeaders = (token?: string) => {
  const headers: Record<string, string> = { ...DEFAULT_HEADERS };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData.message || response.statusText || 'An error occurred'
    );
    (error as any).status = response.status;
    (error as any).data = errorData;
    throw error;
  }
  return response.json();
};
