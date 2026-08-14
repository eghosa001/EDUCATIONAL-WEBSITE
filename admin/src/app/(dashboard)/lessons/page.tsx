'use client';

import { useState } from 'react';
import { PlusIcon, SearchIcon } from 'lucide-react';

export default function LessonsPage() {
  const [lessons] = useState([
    { id: '1', title: 'Cell Structure', course: 'Biology SS2', teacher: 'Mr. Adeyemi', views: 234, completed: 89 },
    { id: '2', title: 'Linear Equations', course: 'Mathematics SSS1', teacher: 'Mrs. Okonkwo', views: 156, completed: 67 },
    { id: '3', title: 'Reading Comprehension', course: 'English JSS3', teacher: 'Mr. Bello', views: 312, completed: 145 },
  ]);
  const [search, setSearch] = useState('');
  const filtered = lessons.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"><PlusIcon className="w-4 h-4" /> New Lesson</button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search lessons..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Title', 'Course', 'Teacher', 'Views', 'Completed', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(l => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{l.title}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{l.course}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{l.teacher}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{l.views}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{l.completed}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">Edit</button><button className="text-sm text-red-600 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
