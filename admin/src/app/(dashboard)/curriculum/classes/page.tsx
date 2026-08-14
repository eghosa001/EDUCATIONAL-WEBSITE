'use client';

import { useState } from 'react';

export default function CurriculumClassesPage() {
  const [classes] = useState([
    { code: 'P1', name: 'Primary 1', level: 'Primary', students: 45 },
    { code: 'P2', name: 'Primary 2', level: 'Primary', students: 42 },
    { code: 'JSS1', name: 'Junior Secondary 1', level: 'Junior Secondary', students: 78 },
    { code: 'SSS1', name: 'Senior Secondary 1', level: 'Senior Secondary', students: 65 },
  ]);
  const [search, setSearch] = useState('');
  const filtered = classes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">+ Add Class</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Code', 'Name', 'Level', 'Students', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => (
              <tr key={c.code} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-sm text-gray-600">{c.code}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.level}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.students}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">Edit</button><button className="text-sm text-red-600 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
