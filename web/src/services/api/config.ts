const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

const DEFAULT_REQUEST_TIMEOUT_MS = 12000;
const DEFAULT_RETRY_DELAY_MS = 350;
const TRANSIENT_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

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

type RequestCacheRecord<T> = {
  savedAt: number;
  data: T;
};

export type ApiFetchOptions = {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  retryOn?: number[];
  signal?: AbortSignal;
};

export type CachedJsonOptions<T> = ApiFetchOptions & {
  cacheKey: string;
  ttlMs?: number;
  allowStaleOnError?: boolean;
  cacheStorage?: 'session' | 'memory';
  select?: (payload: any) => T;
};

const memoryCache = new Map<string, RequestCacheRecord<unknown>>();
const inFlightJson = new Map<string, Promise<unknown>>();

const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

const isBrowser = () => typeof window !== 'undefined';

const readCache = <T>(key: string, storage: 'session' | 'memory', ttlMs?: number): T | null => {
  try {
    const record = storage === 'memory'
      ? memoryCache.get(key) as RequestCacheRecord<T> | undefined
      : isBrowser()
        ? JSON.parse(window.sessionStorage.getItem(key) || 'null') as RequestCacheRecord<T> | null
        : null;
    if (!record?.savedAt) return null;
    if (ttlMs && Date.now() - Number(record.savedAt) > ttlMs) return null;
    return record.data ?? null;
  } catch {
    return null;
  }
};

const readStaleCache = <T>(key: string, storage: 'session' | 'memory'): T | null => {
  try {
    const record = storage === 'memory'
      ? memoryCache.get(key) as RequestCacheRecord<T> | undefined
      : isBrowser()
        ? JSON.parse(window.sessionStorage.getItem(key) || 'null') as RequestCacheRecord<T> | null
        : null;
    return record?.data ?? null;
  } catch {
    return null;
  }
};

const writeCache = <T>(key: string, storage: 'session' | 'memory', data: T) => {
  const record: RequestCacheRecord<T> = { savedAt: Date.now(), data };
  try {
    if (storage === 'memory') memoryCache.set(key, record);
    else if (isBrowser()) window.sessionStorage.setItem(key, JSON.stringify(record));
  } catch {
    // Cache failures must never break navigation.
  }
};

export const isTransientApiStatus = (status?: number) => Boolean(status && TRANSIENT_STATUS_CODES.has(status));

export const isAbortError = (error: unknown) => {
  const value = error as { name?: string; code?: string; message?: string };
  return value?.name === 'AbortError' || value?.code === 'ABORT_ERR' || /aborted/i.test(value?.message || '');
};

export const handleApiError = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData?.error?.message || response.statusText || 'An error occurred'
    ) as any;
    error.status = response.status;
    error.data = errorData;
    error.transient = isTransientApiStatus(response.status);
    throw error;
  }
  return response.json();
};

export const handleApiResponse = async <T>(response: Response): Promise<T> => {
  const data = await handleApiError(response);
  return data as T;
};

export const apiFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<Response> => {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const method = String(init.method || 'GET').toUpperCase();
  const retryOn = new Set(options.retryOn || Array.from(TRANSIENT_STATUS_CODES));
  const retries = options.retries ?? (method === 'GET' || method === 'HEAD' ? 1 : 0);
  const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    let didTimeout = false;
    const timeout = timeoutMs > 0
      ? window.setTimeout(() => { didTimeout = true; controller.abort(); }, timeoutMs)
      : null;
    const abortFromParent = () => controller.abort();
    if (options.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener('abort', abortFromParent, { once: true });
    }

    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      if (response.ok || attempt >= retries || !retryOn.has(response.status)) return response;
      lastError = Object.assign(new Error(response.statusText || 'Temporary service issue'), { status: response.status, transient: true });
    } catch (error) {
      lastError = error;
      const shouldRetry = didTimeout || (!isAbortError(error) && attempt < retries);
      if (!shouldRetry) throw error;
    } finally {
      if (timeout) window.clearTimeout(timeout);
      if (options.signal) options.signal.removeEventListener('abort', abortFromParent);
    }

    if (attempt < retries) await sleep(retryDelayMs * (attempt + 1));
  }

  throw lastError instanceof Error ? lastError : new Error('Request failed');
};

export const fetchApiJson = async <T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: ApiFetchOptions = {},
): Promise<T> => {
  const response = await apiFetch(input, init, options);
  return handleApiResponse<T>(response);
};

export const fetchCachedJson = async <T>(
  input: RequestInfo | URL,
  init: RequestInit,
  options: CachedJsonOptions<T>,
): Promise<T> => {
  const storage = options.cacheStorage || 'session';
  const ttlMs = options.ttlMs ?? 5 * 60 * 1000;
  const cached = readCache<T>(options.cacheKey, storage, ttlMs);
  if (cached) return cached;

  const inFlightKey = `${options.cacheKey}:${String(input)}`;
  const existing = inFlightJson.get(inFlightKey) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fetchApiJson<any>(input, init, options)
    .then(payload => {
      const data = options.select ? options.select(payload) : payload;
      writeCache(options.cacheKey, storage, data);
      return data;
    })
    .catch(error => {
      if (options.allowStaleOnError !== false) {
        const stale = readStaleCache<T>(options.cacheKey, storage);
        if (stale) return stale;
      }
      throw error;
    })
    .finally(() => {
      inFlightJson.delete(inFlightKey);
    });

  inFlightJson.set(inFlightKey, promise);
  return promise;
};
