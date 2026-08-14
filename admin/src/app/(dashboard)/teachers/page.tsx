'use client';

import { useState } from 'react';
import { PlusIcon, SearchIcon } from 'lucide-react';

export default function TeachersPage() {
  const [search, setSearch] = useState('');
  const teachers = [
    { id: '1', name: 'Mr. Adeyemi', subject: 'Biology', courses: 3, students: 142, rating: 4.8, verified: true },
    { id: '2', name: 'Mrs. Okonkwo', subject: 'Mathematics', courses: 2, students: 98, rating: 4.9, verified: true },
    { id: '3', name: 'Mr. Bello', subject: 'English', courses: 4, students: 156, rating: 4.6, verified: false },
  ];

  const filtered = teachers.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <PlusIcon className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search teachers..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Name', 'Subject', 'Courses', 'Students', 'Rating', 'Verified', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.subject}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.courses}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.students}</td>
                <td className="px-4 py-3 text-sm text-yellow-600 font-medium">★ {t.rating}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.verified ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{t.verified ? 'Yes' : 'No'}</span></td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">View</button><button className="text-sm text-red-600 hover:text-red-700">Suspend</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
