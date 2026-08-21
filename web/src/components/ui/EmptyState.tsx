import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white py-16 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400', className)}>
      {Icon && <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300"><Icon className="h-7 w-7" /></div>}
      <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      {description && <p className="mt-1 text-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
