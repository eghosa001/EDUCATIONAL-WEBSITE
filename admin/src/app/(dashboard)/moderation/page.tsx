'use client';

import { useState } from 'react';

export default function ModerationPage() {
  const [filter, setFilter] = useState<'all' | 'flagged' | 'pending'>('all');

  const flags = [
    { id: '1', type: 'post', content: 'Inappropriate language in discussion', author: 'User_123', reported: 3, time: '1h ago', status: 'flagged' },
    { id: '2', type: 'comment', content: 'Spam link detected', author: 'User_456', reported: 1, time: '3h ago', status: 'pending' },
    { id: '3', type: 'lesson', content: 'Incorrect educational content', author: 'Teacher_X', reported: 2, time: '5h ago', status: 'flagged' },
  ];

  const filtered = filter === 'all' ? flags : flags.filter(f => f.status === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Content Moderation</h1>

      <div className="flex gap-2">
        {(['all', 'flagged', 'pending'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? 'bg-red-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">All content is clean!</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.status === 'flagged' ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <span className="text-lg">{item.status === 'flagged' ? '🚩' : '⏳'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">{item.type}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium">{item.status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}</span>
                    <span className="text-xs text-gray-400 ml-auto">{item.time}</span>
                  </div>
                  <p className="font-medium text-gray-900 mt-2">{item.content}</p>
                  <p className="text-sm text-gray-500 mt-1">By: {item.author} · {item.reported} report(s)</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                  <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Remove</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
