import type { ApiError } from '../types/api';

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  defaultPageSize: number;
  maxPageSize: number;
}

const normalizeBaseUrl = (url: string): string => url.replace(/\/+$/, '');

export const apiConfig: ApiConfig = {
  baseUrl: normalizeBaseUrl(
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
      (typeof process !== 'undefined' && process.env.API_URL) ||
      'http://localhost:3001/api/v1'
  ),
  timeoutMs: Number((typeof process !== 'undefined' && process.env.API_TIMEOUT_MS) || 30000),
  defaultPageSize: 20,
  maxPageSize: 100,
};

export const buildAuthHeader = (token?: string | null): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

export const buildHeaders = (token?: string | null): Record<string, string> => ({
  'Content-Type': 'application/json',
  ...buildAuthHeader(token),
});

export interface ApiFetchOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export const parseErrorMessage = (body: unknown, fallback = 'Request failed'): string => {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    if (typeof obj.message === 'string') return obj.message;
    if (typeof obj.error === 'string') return obj.error;
    if (obj.errors && typeof obj.errors === 'object') {
      const messages = Object.values(obj.errors as Record<string, unknown>).filter(
        (v): v is string => typeof v === 'string'
      );
      if (messages.length) return messages.join(', ');
    }
  }
  return fallback;
};

export const mapApiError = async (response: Response, fallback = 'Request failed'): Promise<ApiError> => {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const message = parseErrorMessage(body, response.statusText || fallback);

  return {
    success: false,
    statusCode: response.status,
    error: response.statusText || 'Request error',
    message,
    ...(body && typeof body === 'object' && (body as Record<string, unknown>).errors
      ? { errors: (body as Record<string, unknown>).errors as Record<string, string[]> }
      : {}),
  };
};

export const request = async <T>(path: string, options: ApiFetchOptions = {}): Promise<T> => {
  const { method = 'GET', body, token, headers, timeoutMs } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs ?? apiConfig.timeoutMs);

  try {
    const response = await fetch(`${apiConfig.baseUrl}${path}`, {
      method,
      headers: { ...buildHeaders(token), ...headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await mapApiError(response);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs ?? apiConfig.timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
};

export const api = {
  get: <T>(path: string, token?: string | null, timeoutMs?: number) =>
    request<T>(path, { method: 'GET', token, timeoutMs }),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body, token }),
  put: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'PUT', body, token }),
  patch: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body, token }),
  delete: <T>(path: string, token?: string | null) => request<T>(path, { method: 'DELETE', token }),
};
