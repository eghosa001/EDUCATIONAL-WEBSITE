'use client';

import { useState } from 'react';
import { PlusIcon, CalendarIcon, ClockIcon } from 'lucide-react';

const assignments = [
  { id: '1', title: 'Essay on Colonialism', subject: 'History', dueDate: '2024-02-15', status: 'pending', score: null },
  { id: '2', title: 'Algebra Problem Set #5', subject: 'Mathematics', dueDate: '2024-02-12', status: 'submitted', score: 85 },
  { id: '3', title: 'Lab Report: Photosynthesis', subject: 'Biology', dueDate: '2024-02-10', status: 'graded', score: 92 },
];

export default function AssignmentsPage() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = filter === 'all' ? assignments : assignments.filter(a => a.status === filter);
  const pending = assignments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-500 mt-1">{pending} pending assignments</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" /> New Assignment
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['all', 'pending', 'submitted', 'graded'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${filter === f ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}{f === 'pending' && ` (${pending})`}
          </button>
        ))}
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create Assignment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Assignment Title" className="px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg outline-none">
              <option>Select Subject</option>
              <option>Mathematics</option>
              <option>English</option>
              <option>Science</option>
            </select>
            <input type="date" className="px-3 py-2 border border-gray-300 rounded-lg outline-none" />
            <input placeholder="Max Score" type="number" className="px-3 py-2 border border-gray-300 rounded-lg outline-none" />
          </div>
          <textarea placeholder="Instructions" className="w-full mt-3 px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" rows={3} />
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Create</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">No assignments found</div>
        ) : (
          filtered.map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${a.status === 'graded' ? 'bg-green-100' : a.status === 'submitted' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                {a.status === 'graded' ? '✓' : a.status === 'submitted' ? '→' : '!'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{a.title}</p>
                <p className="text-sm text-gray-500">{a.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 flex items-center gap-1 justify-end"><CalendarIcon className="w-3 h-3" />{a.dueDate}</p>
                {a.score !== null && <p className="text-sm font-semibold text-green-600 mt-1">{a.score}%</p>}
              </div>
              <button className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                {a.status === 'pending' ? 'Submit' : 'View'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
