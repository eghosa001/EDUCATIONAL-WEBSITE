'use client';

import { useState } from 'react';
import { FileBarChartIcon, PlayIcon, ClockIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import StatCard from '@/components/ui/StatCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Field from '@/components/ui/Field';
import { formatDate, timeAgo } from '@/utils/format';
import { useReports } from './hooks';
import type { ReportType } from '@/services/api/reportService';

const REPORT_TYPES: Array<{ value: ReportType; label: string }> = [
  { value: 'user_summary', label: 'User Summary' },
  { value: 'revenue_summary', label: 'Revenue Summary' },
  { value: 'content_summary', label: 'Content Summary' },
  { value: 'exam_performance', label: 'Exam Performance' },
  { value: 'subscriptions_summary', label: 'Subscriptions Summary' },
  { value: 'teacher_earnings', label: 'Teacher Earnings' },
];

const CHART_PALETTE = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];

interface ChartDatum {
  label: string;
  value: number;
}

export default function ReportsManager() {
  const { reports, loading, error, reload, generate } = useReports();
  const [type, setType] = useState<ReportType>('user_summary');
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<ChartDatum[]>([]);
  const [resultTitle, setResultTitle] = useState('');
  const [flash, setFlash] = useState('');

  if (loading) return <Spinner label="Loading reports..." />;

  const runReport = async () => {
    setGenerating(true);
    try {
      const res = await generate({ type, title: title || undefined });
      if (res) {
        setResultTitle(title || REPORT_TYPES.find((t) => t.value === type)?.label || type);
        setResult(normalizeReportData(res.data));
        setFlash('Report generated');
      }
    } catch (err) {
      setFlash((err as Error).message || 'Failed to generate report');
    } finally {
      setGenerating(false);
      setTimeout(() => setFlash(''), 3000);
    }
  };

  const normalizeReportData = (data: unknown): ChartDatum[] => {
    if (Array.isArray(data)) {
      return data
        .map((item) => {
          if (typeof item !== 'object' || item === null) return null;
          const obj = item as Record<string, unknown>;
          const key = obj.label ?? obj.name ?? obj.month ?? Object.keys(obj)[0];
          const val = obj.value ?? obj.count ?? obj.total ?? obj.revenue ?? Object.values(obj)[1];
          if (typeof val !== 'number') return null;
          return { label: String(key), value: val };
        })
        .filter((d): d is ChartDatum => d !== null)
        .slice(0, 20);
    }
    if (typeof data === 'object' && data !== null) {
      const entries = Object.entries(data as Record<string, unknown>);
      return entries
        .map(([label, value]) =>
          typeof value === 'number' && label !== 'total' && label !== 'count' ? { label, value } : null
        )
        .filter((d): d is ChartDatum => d !== null)
        .slice(0, 20);
    }
    return [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button onClick={reload} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Reports Generated" value={String(reports.length)} icon={FileBarChartIcon} tone="indigo" />
        <StatCard label="Report Types" value={String(REPORT_TYPES.length)} icon={FileBarChartIcon} tone="purple" />
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}

      <Card title="Report Builder" description="Generate a report and preview its summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Report type">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Title (optional)">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q1 User Growth"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </Field>
          <div className="flex items-end">
            <Button onClick={runReport} loading={generating}>
              <PlayIcon className="w-4 h-4 mr-1.5" /> Generate
            </Button>
          </div>
        </div>

        {result.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-900 mb-4">{resultTitle}</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={result}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill={CHART_PALETTE[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </Card>

      <Card title="Recent Reports" description="Previously generated reports" icon={ClockIcon}>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No reports generated yet</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{r.title || r.type.replace('_', ' ')}</p>
                  <p className="text-xs text-gray-400">{r.type.replace('_', ' ')} · {timeAgo(r.createdAt)}</p>
                </div>
                <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
