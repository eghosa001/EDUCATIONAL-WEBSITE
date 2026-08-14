'use client';

import { useState } from 'react';
import { PlusIcon, SearchIcon } from 'lucide-react';

export default function StudentsPage() {
  const [search, setSearch] = useState('');
  const students = [
    { id: '1', name: 'Emeka Nnamdi', email: 'emeka@example.com', class: 'SSS2', school: 'FGC Abuja', status: 'active', enrolled: 'Jan 2024' },
    { id: '2', name: 'Aisha Mohammed', email: 'aisha@example.com', class: 'JSS3', school: 'Grace School Lagos', status: 'active', enrolled: 'Feb 2024' },
    { id: '3', name: 'Chidi Osei', email: 'chidi@example.com', class: 'P5', school: 'State Primary Kano', status: 'inactive', enrolled: 'Dec 2023' },
  ];

  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"><PlusIcon className="w-4 h-4" /> Add Student</button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Name', 'Email', 'Class', 'School', 'Status', 'Enrolled', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.email}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.class}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.school}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{s.enrolled}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">View</button><button className="text-sm text-gray-400 hover:text-gray-600">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
