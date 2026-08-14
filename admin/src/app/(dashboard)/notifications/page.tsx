'use client';

import { useState } from 'react';

export default function NotificationsAdminPage() {
  const [notifications, setNotifications] = useState([
    { id: '1', type: 'exam_reminder', title: 'Exam Starting Soon', recipients: 234, sent: true, time: '2h ago' },
    { id: '2', type: 'assignment_due', title: 'Assignment Deadline', recipients: 156, sent: false, time: '5h ago' },
    { id: '3', type: 'result_published', title: 'Results Available', recipients: 89, sent: true, time: '1d ago' },
  ]);
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <button onClick={() => setShowCompose(!showCompose)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Send Notification</button>
      </div>

      {showCompose && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Compose Notification</h2>
          <div className="space-y-4">
            <input placeholder="Title" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
            <textarea placeholder="Message" className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" rows={3} />
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none">
              <option>All Students</option>
              <option>By Class</option>
              <option>By School</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium">Send</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map(n => (
          <div key={n.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${n.sent ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <span className="text-sm">{n.sent ? '✓' : '⏳'}</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-500">{n.recipients} recipients · {n.time}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${n.sent ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{n.sent ? 'Sent' : 'Pending'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
