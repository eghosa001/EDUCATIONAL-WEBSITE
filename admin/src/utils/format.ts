export const formatNumber = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return Number(value).toLocaleString('en-NG');
};

export const formatNaira = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '₦0';
  return `₦${Number(value).toLocaleString('en-NG')}`;
};

export const formatCompactNaira = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '₦0';
  const n = Number(value);
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString('en-NG')}`;
};

export const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDateTime = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const timeAgo = (value?: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
};

export const titleCase = (value?: string | null): string => {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const truncate = (value?: string | null, length = 60): string => {
  if (!value) return '—';
  return value.length > length ? `${value.slice(0, length)}...` : value;
};
