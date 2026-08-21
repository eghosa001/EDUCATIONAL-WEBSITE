import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
}

export default function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading,
  disabled,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-brand-600 text-white shadow-brand-sm hover:bg-brand-700 hover:shadow-brand disabled:bg-brand-300',
    secondary: 'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-brand-200 hover:text-brand-700 disabled:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-brand-700 dark:hover:text-brand-300',
    ghost: 'bg-transparent text-slate-600 hover:bg-brand-50 hover:text-brand-700 disabled:text-slate-300 dark:text-slate-300 dark:hover:bg-brand-950/40 dark:hover:text-brand-300',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 disabled:bg-red-300',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!isLoading && LeftIcon && <LeftIcon className="w-4 h-4" />}
      {children}
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4" />}
    </button>
  );
}
