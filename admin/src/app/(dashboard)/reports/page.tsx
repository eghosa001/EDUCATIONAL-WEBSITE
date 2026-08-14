'use client';

import { useState } from 'react';
import { DownloadIcon, FilterIcon } from 'lucide-react';
import Recharts from 'recharts';

const data = [
  { month: 'Jan', users: 1200, revenue: 45000 },
  { month: 'Feb', users: 1500, revenue: 52000 },
  { month: 'Mar', users: 1800, revenue: 61000 },
  { month: 'Apr', users: 2100, revenue: 78000 },
  { month: 'May', users: 2400, revenue: 92000 },
  { month: 'Jun', users: 2800, revenue: 105000 },
];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('last30');
  const [format, setFormat] = useState('pdf');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <div className="flex gap-2">
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
            <option value="last90">Last 90 days</option>
            <option value="thisYear">This year</option>
          </select>
          <select value={format} onChange={e => setFormat(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
            <DownloadIcon className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">User Growth</h2>
        <div className="h-48 flex items-end gap-2">
          {data.map(d => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-blue-500 rounded-t-sm" style={{ height: `${(d.users / 2800) * 160}px` }} />
              <span className="text-xs text-gray-500">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <div className="h-40 flex items-end gap-2">
            {data.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-green-500 rounded-t-sm" style={{ height: `${(d.revenue / 105000) * 140}px` }} />
                <span className="text-xs text-gray-500">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Key Metrics</h2>
          <div className="space-y-3">
            {[{ label: 'Active Users', value: '2,847', change: '+12%' },
              { label: 'New Signups', value: '423', change: '+8%' },
              { label: 'Course Enrollments', value: '1,234', change: '+15%' },
              { label: 'Revenue', value: '₦105,000', change: '+22%' }].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{m.label}</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">{m.value}</span>
                  <span className="text-xs text-green-600 ml-2">{m.change}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
