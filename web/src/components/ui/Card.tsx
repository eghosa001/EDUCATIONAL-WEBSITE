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
    <div className={cn('bg-white rounded-xl border border-gray-200', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-gray-400" />}
            <div>
              {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
              {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
