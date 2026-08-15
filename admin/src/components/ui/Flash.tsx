'use client';

type FlashTone = 'error' | 'success' | 'info';

const toneStyles: Record<FlashTone, string> = {
  error: 'bg-red-50 border-red-200 text-red-700',
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

interface FlashProps {
  tone?: FlashTone;
  message?: string;
  onDismiss?: () => void;
}

export default function Flash({ tone = 'error', message, onDismiss }: FlashProps) {
  if (!message) return null;
  return (
    <div className={`p-3 border rounded-lg text-sm flex items-center justify-between ${toneStyles[tone]}`}>
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="ml-3 text-xs font-medium underline">
          Dismiss
        </button>
      )}
    </div>
  );
}
