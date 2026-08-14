'use client';

import { useState } from 'react';

export default function CurriculumTopicsPage() {
  const [topics] = useState([
    { id: '1', name: 'Cell Biology', subject: 'Biology', class: 'SSS2', subtopics: 8 },
    { id: '2', name: 'Algebra Basics', subject: 'Mathematics', class: 'SSS1', subtopics: 12 },
    { id: '3', name: 'Reading Comprehension', subject: 'English', class: 'JSS3', subtopics: 6 },
  ]);
  const [search, setSearch] = useState('');
  const filtered = topics.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Topics</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">+ Add Topic</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Name', 'Subject', 'Class', 'Subtopics', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.subject}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.class}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{t.subtopics}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">Edit</button><button className="text-sm text-red-600 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
