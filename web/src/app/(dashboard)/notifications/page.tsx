'use client';

import { useEffect, useState } from 'react';
import { BellIcon, CheckIcon, TrashIcon } from 'lucide-react';

interface Notification {
  id: string;
  type: 'exam' | 'assignment' | 'result' | 'announcement' | 'payment';
  title: string;
  message: string;
  read: boolean;
  time: string;
}

const mockNotifications: Notification[] = [
  { id: '1', type: 'exam', title: 'Biology Exam Tomorrow', message: 'Your Biology exam on Cell Biology starts at 10:00 AM.', read: false, time: '2h ago' },
  { id: '2', type: 'result', title: 'Mathematics Result Available', message: 'You scored 85% in your Mathematics quiz. Great job!', read: false, time: '5h ago' },
  { id: '3', type: 'assignment', title: 'New Assignment', message: 'English Language assignment due by Friday.', read: true, time: '1d ago' },
  { id: '4', type: 'announcement', title: 'School Closed Next Week', message: 'Federal holiday announced — no classes next Monday.', read: true, time: '2d ago' },
  { id: '5', type: 'payment', title: 'Subscription Renewed', message: 'Your Student Premium subscription has been renewed.', read: true, time: '3d ago' },
];

const typeColors: Record<string, string> = {
  exam: 'bg-red-100 text-red-600',
  result: 'bg-green-100 text-green-600',
  assignment: 'bg-blue-100 text-blue-600',
  announcement: 'bg-yellow-100 text-yellow-600',
  payment: 'bg-purple-100 text-purple-600',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <button onClick={markAllRead} className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
            Mark all read
          </button>
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none">
            <option value="all">All</option>
            <option value="unread">Unread</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <div key={n.id} className={`bg-white rounded-xl border p-4 flex gap-4 ${n.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50/50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[n.type] || 'bg-gray-100'}`}>
                <BellIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <p className={`font-medium text-sm ${n.read ? 'text-gray-700' : 'text-gray-900'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{n.time}</p>
              </div>
              <button className="text-gray-400 hover:text-red-500 flex-shrink-0">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
