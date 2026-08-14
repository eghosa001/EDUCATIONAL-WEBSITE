'use client';

import { useState } from 'react';
import { PlusIcon, SearchIcon, FilterIcon } from 'lucide-react';

export default function ExamsPage() {
  const [exams] = useState([
    { id: '1', title: 'SS2 Biology Mid-Term', type: 'Timed', subject: 'Biology', class: 'SSS2', questions: 40, status: 'published' },
    { id: '2', title: 'JAMB Practice English', type: 'Practice', subject: 'English', class: 'JSS3', questions: 60, status: 'draft' },
    { id: '3', title: 'WAEC Mock Mathematics', type: 'Mock', subject: 'Mathematics', class: 'SSS3', questions: 50, status: 'published' },
  ]);
  const [search, setSearch] = useState('');
  const filtered = exams.filter(e => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"><PlusIcon className="w-4 h-4" /> New Exam</button>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Title', 'Type', 'Subject', 'Class', 'Questions', 'Status', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(exam => (
              <tr key={exam.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{exam.title}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{exam.type}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{exam.subject}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{exam.class}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{exam.questions}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{exam.status}</span></td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">Edit</button><button className="text-sm text-red-600 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
