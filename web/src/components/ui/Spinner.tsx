import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export default function Spinner({ size = 'md', className, label }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className={cn('animate-spin rounded-full border-4 border-gray-200 border-t-blue-600', sizes[size])} />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
