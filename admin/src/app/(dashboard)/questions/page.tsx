'use client';

import { useState } from 'react';
import { PlusIcon, SearchIcon, FilterIcon } from 'lucide-react';

const questionTypes = ['mcq', 'true_false', 'fill_blank', 'short_answer', 'essay', 'matching', 'numerical', 'image_based'];

export default function QuestionsPage() {
  const [questions] = useState([
    { id: '1', text: 'What is the capital of Nigeria?', type: 'mcq', subject: 'Geography', difficulty: 'easy', usage: 145 },
    { id: '2', text: 'The process by which plants make food is called...', type: 'fill_blank', subject: 'Biology', difficulty: 'medium', usage: 89 },
    { id: '3', text: 'Calculate: 15 × 23', type: 'numerical', subject: 'Mathematics', difficulty: 'easy', usage: 234 },
    { id: '4', text: 'Explain the theory of evolution.', type: 'essay', subject: 'Biology', difficulty: 'hard', usage: 56 },
  ]);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');

  const filtered = questions.filter(q => {
    const matchesSearch = q.text.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = filterSubject === 'all' || q.subject.toLowerCase() === filterSubject;
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"><PlusIcon className="w-4 h-4" /> Add Question</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
          <option value="all">All Subjects</option>
          <option value="biology">Biology</option>
          <option value="mathematics">Mathematics</option>
          <option value="geography">Geography</option>
        </select>
        <select value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
          <option value="all">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Question', 'Type', 'Subject', 'Difficulty', 'Usage', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(q => (
              <tr key={q.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{q.text}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium uppercase">{q.type}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500 capitalize">{q.subject}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{q.usage}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">Edit</button><button className="text-sm text-red-600 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
