import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

const variants = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  error: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  info: 'bg-brand-50 text-brand-700 dark:bg-brand-950/50 dark:text-brand-300',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ring-black/5 dark:ring-white/10', variants[variant], className)}>
      {children}
    </span>
  );
}
