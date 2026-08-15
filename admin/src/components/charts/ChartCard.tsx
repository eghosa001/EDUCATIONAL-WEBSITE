'use client';

import type { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export default function ChartCard({ title, description, icon: Icon, children, className = '' }: ChartCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-gray-400" />}
        <div>
          <h2 className="font-semibold text-gray-900 text-sm">{title}</h2>
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
