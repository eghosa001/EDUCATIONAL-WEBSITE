'use client';

import { ActivityIcon, DatabaseIcon, DollarSignIcon, CpuIcon } from 'lucide-react';
import Card from '@/components/ui/Card';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import { formatNumber } from '@/utils/format';
import { useAiUsage } from './hooks';

const num = (v: unknown): number => (typeof v === 'number' ? v : 0);

export default function AiUsageManager() {
  const { stats, loading, error, reload } = useAiUsage();

  if (loading) return <Spinner label="Loading AI usage..." />;

  const modelUsage = Array.isArray(stats?.modelUsage) ? stats.modelUsage : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={reload} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Refresh
        </button>
      </div>

      {error && <Flash tone="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Requests Today" value={formatNumber(num(stats?.todayRequests))} icon={ActivityIcon} tone="blue" />
        <StatCard label="Requests This Week" value={formatNumber(num(stats?.weekRequests))} icon={ActivityIcon} tone="green" />
        <StatCard label="Total Requests" value={formatNumber(num(stats?.totalRequests))} icon={DatabaseIcon} tone="purple" />
        <StatCard label="Total Cost" value={stats?.totalCost !== undefined && stats?.totalCost !== null ? String(stats.totalCost) : '—'} icon={DollarSignIcon} tone="orange" />
      </div>

      <Card title="Model Usage" description="Requests, tokens and cost per model" icon={CpuIcon}>
        {modelUsage.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No model usage data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Model', 'Requests', 'Tokens', 'Cost', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {modelUsage.map((m, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono text-sm">{m.model}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatNumber(num(m.requests))}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatNumber(num(m.tokens))}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {m.cost !== undefined && m.cost !== null ? String(m.cost) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="green">Active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
