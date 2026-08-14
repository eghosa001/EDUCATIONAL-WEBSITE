'use client';

import { useState } from 'react';

export default function ParentsUsersPage() {
  const [parents] = useState([
    { id: '1', name: 'Mrs. Adebayo', email: 'adebayo@example.com', children: 2, status: 'active' },
    { id: '2', name: 'Mr. Okoro', email: 'okoro@example.com', children: 1, status: 'active' },
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Parent Accounts</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Name', 'Email', 'Children', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {parents.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{p.children}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{p.status}</span></td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">View</button><button className="text-sm text-red-600 hover:text-red-700">Suspend</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
