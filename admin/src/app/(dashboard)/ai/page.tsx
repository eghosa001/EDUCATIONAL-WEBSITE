'use client';

import { useState } from 'react';

export default function AiPage() {
  const [usage] = useState({ today: 1247, thisWeek: 8934, total: 156420 });
  const [models] = useState([
    { name: 'agnes-2.5-flash', questions: 89012, avgResponseTime: '1.2s', cost: '$0.45' },
    { name: 'gpt-4-turbo', questions: 12034, avgResponseTime: '2.1s', cost: '$2.30' },
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">AI Management</h1>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Today', value: usage.today.toLocaleString(), color: 'blue' },
          { label: 'This Week', value: usage.thisWeek.toLocaleString(), color: 'green' },
          { label: 'Total', value: usage.total.toLocaleString(), color: 'purple' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">AI Models</h2>
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Model', 'Questions', 'Avg Response Time', 'Cost', 'Status'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {models.map(m => (
              <tr key={m.name}>
                <td className="px-4 py-3 font-mono text-sm">{m.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.questions.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.avgResponseTime}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.cost}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
