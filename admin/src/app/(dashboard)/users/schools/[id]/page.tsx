'use client';

import { useState } from 'react';

export default function SchoolsUsersPage() {
  const [schools] = useState([
    { id: '1', name: 'FGC Abuja', students: 1250, status: 'active' },
    { id: '2', name: 'Grace International', students: 890, status: 'active' },
    { id: '3', name: 'King\'s College', students: 670, status: 'suspended' },
  ]);
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelected(null)} className="text-sm text-blue-600 hover:text-blue-700">← Back to Schools</button>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900">School: {selected}</h2>
          <p className="text-gray-500 mt-1">School management details coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">School Users</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['School Name', 'Students', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {schools.map(s => (
              <tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(s.name)}>
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.students}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-sm text-blue-600 hover:text-blue-700">View Details</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
