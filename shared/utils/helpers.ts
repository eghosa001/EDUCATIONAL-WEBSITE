import type { Pagination } from '../types/api';

export const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const truncate = (input: string, maxLength: number, suffix = '…'): string =>
  input.length > maxLength ? `${input.slice(0, maxLength)}${suffix}` : input;

export const buildPagination = (page = 1, limit = 20, total = 0): Pagination => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / Math.max(1, limit)),
});

export const calculateOffset = (page = 1, limit = 20): number => Math.max(0, (page - 1) * limit);

export const normalizePage = (page: unknown, fallback = 1): number => {
  const parsed = Number(page);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const normalizeLimit = (limit: unknown, fallback = 20, max = 100): number => {
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return clamp(Math.floor(parsed), 1, max);
};

const NGN_FORMATTER = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NGN_SYMBOL_FORMATTER = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatNaira = (amount: number | string | null | undefined): string => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return NGN_FORMATTER.format(0);
  return NGN_FORMATTER.format(value);
};

export const formatNairaSymbol = (amount: number | string | null | undefined): string => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `₦${NGN_SYMBOL_FORMATTER.format(0)}`;
  return `₦${NGN_SYMBOL_FORMATTER.format(value)}`;
};

export const formatCompact = (amount: number | string | null | undefined): string => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return '0';
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
};

export const formatDate = (
  date: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }
): string => {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', options).format(parsed);
};

export const formatDateTime = (
  date: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string => formatDate(date, options);

export const formatRelativeTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return '—';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';

  const seconds = Math.floor((Date.now() - parsed.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(parsed);
};

export const formatFileSize = (bytes: number | null | undefined): string => {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return '—';
  if (value === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** i;
  return `${size >= 10 || i === 0 ? Math.round(size) : size.toFixed(1)} ${units[i]}`;
};

export const formatPercentage = (value: number | string | null | undefined, decimals = 0): string => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '—';
  return `${clamp(parsed, 0, 100).toFixed(decimals)}%`;
};

export const formatMinutes = (minutes: number | string | null | undefined): string => {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return '—';
  if (value < 60) return `${Math.round(value)}m`;
  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
};

export const toKobo = (naira: number): number => Math.round(naira * 100);
export const fromKobo = (kobo: number): number => kobo / 100;

export const isDefined = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

export const uniqueBy = <T, K>(items: T[], keyFn: (item: T) => K): T[] => {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const groupBy = <T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<string, T[]> =>
  items.reduce<Record<string, T[]>>((acc, item) => {
    const key = String(keyFn(item));
    (acc[key] = acc[key] || []).push(item);
    return acc;
  }, {});
