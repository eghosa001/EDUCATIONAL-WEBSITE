'use client';

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from 'lucide-react';

const pendingContent = [
  { id: '1', type: 'lesson', title: 'Advanced Calculus Part 2', author: 'Dr. Sarah', submitted: '2h ago', reason: 'New lesson submission' },
  { id: '2', type: 'question', title: 'WAEC 2024 Physics Q5', author: 'Mr. Adeyemi', submitted: '5h ago', reason: 'Question bank addition' },
  { id: '3', type: 'course', title: 'Introduction to Programming', author: 'Mrs. Okonkwo', submitted: '1d ago', reason: 'New course' },
];

export default function ContentApprovalPage() {
  const [items, setItems] = useState(pendingContent);
  const [approved, setApproved] = useState(0);
  const [rejected, setRejected] = useState(0);

  const handleApprove = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setApproved(a => a + 1);
  };

  const handleReject = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setRejected(r => r + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Content Approval</h1>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">Approved: {approved}</span>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">Rejected: {rejected}</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm">No pending content for approval</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⏳</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium capitalize">{item.type}</span>
                    <span className="text-xs text-gray-400">{item.submitted}</span>
                  </div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">by {item.author} · {item.reason}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(item.id)} className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    <CheckCircleIcon className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleReject(item.id)} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                    <XCircleIcon className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
