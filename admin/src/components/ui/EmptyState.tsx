'use client';

import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon, title = 'Nothing here yet', message, action }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{title}</p>
      {message && <p className="text-sm text-gray-400 mt-1">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
