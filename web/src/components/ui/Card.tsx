import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
}

export default function Card({ children, className, title, description, icon: Icon, action }: CardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-brand-sm dark:bg-slate-900 dark:border-slate-800', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />}
            <div>
              {title && <h3 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h3>}
              {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
