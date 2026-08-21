import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
}

export default function Input({ label, error, hint, className, leftIcon: LeftIcon, rightIcon: RightIcon, ...props }: InputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {label && <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>}
      <div className="relative">
        {LeftIcon && <LeftIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
        <input
          className={cn(
            'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400',
            'focus:border-brand-500 focus:ring-4 focus:ring-brand-100 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:focus:ring-brand-950',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950',
            LeftIcon && 'pl-9',
            RightIcon && 'pr-9',
          )}
          {...props}
        />
        {RightIcon && <RightIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
