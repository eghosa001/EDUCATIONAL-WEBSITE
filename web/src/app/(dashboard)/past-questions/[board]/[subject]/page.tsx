'use client';

import { useState } from 'react';
import { SearchIcon, FilterIcon } from 'lucide-react';

const pastQuestions = [
  { id: '1', year: 2023, subject: 'Mathematics', board: 'WAEC', difficulty: 'Medium' },
  { id: '2', year: 2023, subject: 'English', board: 'JAMB', difficulty: 'Easy' },
  { id: '3', year: 2022, subject: 'Physics', board: 'WAEC', difficulty: 'Hard' },
  { id: '4', year: 2023, subject: 'Biology', board: 'NECO', difficulty: 'Medium' },
  { id: '5', year: 2022, subject: 'Chemistry', board: 'JAMB', difficulty: 'Hard' },
];

export default function PastQuestionsBoardSubjectPage() {
  const [search, setSearch] = useState('');
  const filtered = pastQuestions.filter(q =>
    q.subject.toLowerCase().includes(search.toLowerCase()) ||
    q.board.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Past Questions</h1>
        <p className="text-gray-500 mt-1">Practice with real exam questions</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by subject or board..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Year', 'Subject', 'Board', 'Difficulty', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(q => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900">{q.year}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{q.subject}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">{q.board}</span></td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span></td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Practice</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-gray-500">No results found</div>}
      </div>
    </div>
  );
}
