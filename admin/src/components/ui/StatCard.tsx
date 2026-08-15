'use client';

import type { LucideIcon } from 'lucide-react';

export type StatTone = 'indigo' | 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'yellow';

const toneStyles: Record<StatTone, { bg: string; text: string; chip: string }> = {
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', chip: 'bg-indigo-50 text-indigo-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', chip: 'bg-blue-50 text-blue-600' },
  green: { bg: 'bg-green-100', text: 'text-green-600', chip: 'bg-green-50 text-green-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', chip: 'bg-purple-50 text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', chip: 'bg-orange-50 text-orange-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600', chip: 'bg-red-50 text-red-600' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', chip: 'bg-yellow-50 text-yellow-700' },
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatTone;
  change?: string;
  changeTone?: 'up' | 'down' | 'neutral';
}

export default function StatCard({ label, value, icon: Icon, tone = 'indigo', change, changeTone = 'up' }: StatCardProps) {
  const styles = toneStyles[tone];
  const changeClass =
    changeTone === 'up' ? 'text-green-600 bg-green-50' : changeTone === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${styles.bg}`}>
          <Icon className={`w-5 h-5 ${styles.text}`} />
        </div>
        {change && <span className={`text-xs font-medium px-2 py-1 rounded-full ${changeClass}`}>{change}</span>}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
