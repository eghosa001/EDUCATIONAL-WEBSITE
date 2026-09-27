const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const apiConfig = {
  baseUrl: API_BASE_URL,
  headers: DEFAULT_HEADERS,
  timeout: 10000,
  credentials: 'include' as const,
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, '');
const SUPABASE_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const learnerApiConfig = {
  baseUrl: SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/web-api` : API_BASE_URL,
  credentials: 'omit' as const,
};

export const getLearnerApiHeaders = (token?: string) => {
  const headers = getAuthHeaders(token);
  if (SUPABASE_PUBLIC_KEY) headers.apikey = SUPABASE_PUBLIC_KEY;
  return headers;
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
      errorData?.error?.message || response.statusText || 'An error occurred'
    ) as any;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
};

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  const data = await handleApiError(response);
  return data as T;
};
