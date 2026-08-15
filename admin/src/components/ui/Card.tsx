'use client';

import type { LucideIcon } from 'lucide-react';

interface CardProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
}

export default function Card({ title, description, action, children, className = '', icon: Icon }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-gray-400" />}
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
              {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="px-5 pb-5">{children}</div>
    </div>
  );
}
