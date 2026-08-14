'use client';

import { useState } from 'react';

const subjects = [
  { id: '1', name: 'Mathematics', code: 'MATH', color: '#3B82F6', topics: 24, courses: 8, isActive: true },
  { id: '2', name: 'English Language', code: 'ENG', color: '#10B981', topics: 18, courses: 6, isActive: true },
  { id: '3', name: 'Biology', code: 'BIO', color: '#F59E0B', topics: 32, courses: 10, isActive: true },
  { id: '4', name: 'Chemistry', code: 'CHEM', color: '#EF4444', topics: 28, courses: 9, isActive: true },
  { id: '5', name: 'Physics', code: 'PHY', color: '#8B5CF6', topics: 22, courses: 7, isActive: true },
];

export default function CurriculumSubjectsPage() {
  const [items, setItems] = useState(subjects);
  const [search, setSearch] = useState('');
  const filtered = items.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">+ Add Subject</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: s.color }}>{s.code[0]}</div>
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{s.code}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {s.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex gap-4 mt-4 text-sm text-gray-500">
              <span>{s.topics} topics</span>
              <span>{s.courses} courses</span>
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <button className="flex-1 text-sm text-blue-600 hover:bg-blue-50 py-1.5 rounded-lg">Edit</button>
              <button className="flex-1 text-sm text-red-600 hover:bg-red-50 py-1.5 rounded-lg">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
