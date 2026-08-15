'use client';

export type BadgeTone = 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'indigo' | 'purple';

const toneStyles: Record<BadgeTone, string> = {
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  purple: 'bg-purple-100 text-purple-700',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ tone = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${toneStyles[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function statusTone(status?: string | null): BadgeTone {
  const s = status?.toLowerCase() ?? '';
  if (['active', 'completed', 'published', 'paid', 'approved', 'success', 'verified', 'yes'].includes(s)) return 'green';
  if (['pending', 'draft', 'pending_review', 'in_progress', 'processing', 'trialing', 'suspended'].includes(s)) return 'yellow';
  if (['failed', 'expired', 'cancelled', 'canceled', 'rejected', 'archived', 'refunded', 'inactive', 'no'].includes(s)) return 'red';
  if (s === 'hidden' || s === 'moderated') return 'purple';
  return 'blue';
}
