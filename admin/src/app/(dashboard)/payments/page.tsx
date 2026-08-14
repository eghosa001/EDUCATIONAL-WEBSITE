'use client';

import { useState } from 'react';
import { DownloadIcon, CreditCardIcon } from 'lucide-react';

const payments = [
  { id: '1', user: 'Emeka Johnson', amount: '₦5,000', plan: 'Student Premium', status: 'completed', date: '2024-01-28' },
  { id: '2', user: 'Aisha Mohammed', amount: '₦2,500', plan: 'Student Basic', status: 'completed', date: '2024-01-27' },
  { id: '3', user: 'Chidi Osei', amount: '₦50,000', plan: 'School Annual', status: 'pending', date: '2024-01-26' },
  { id: '4', user: 'Fatima Abubakar', amount: '₦5,000', plan: 'Student Premium', status: 'failed', date: '2024-01-25' },
];

export default function PaymentsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = payments.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.user.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totals = { completed: 0, pending: 0, failed: 0 };
  payments.forEach(p => { if (p.status === 'completed') totals.completed += 5000; else if (p.status === 'pending') totals.pending += 5000; });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"><DownloadIcon className="w-4 h-4" /> Export</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Completed', value: `₦${totals.completed.toLocaleString()}`, color: 'green' },
          { label: 'Pending', value: `₦${totals.pending.toLocaleString()}`, color: 'yellow' },
          { label: 'Failed', value: '₦0', color: 'red' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['all', 'completed', 'pending', 'failed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['User', 'Amount', 'Plan', 'Status', 'Date', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.user}</td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">{p.amount}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.plan}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'completed' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{p.status}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.date}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700">Receipt</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
