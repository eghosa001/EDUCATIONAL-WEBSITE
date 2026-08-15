'use client';

import { useEffect, useState } from 'react';
import { BellIcon, CheckIcon, TrashIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';

const typeColors: Record<string, string> = {
  exam: 'bg-red-100 text-red-600',
  result: 'bg-green-100 text-green-600',
  assignment: 'bg-blue-100 text-blue-600',
  announcement: 'bg-yellow-100 text-yellow-600',
  payment: 'bg-purple-100 text-purple-600',
};

export default function NotificationsPage() {
  const { token } = useAuthStore();
  const authToken = token ?? undefined;
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) { setLoading(false); return; }

    fetch('http://localhost:3000/api/v1/notifications?limit=50', {
      headers: { 'Authorization': `Bearer ${authToken}` },
    })
      .then(res => res.json())
      .then(data => setNotifications(data.data || []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [authToken]);

  const markAsRead = async (id: string) => {
    if (!authToken) return;
    await fetch(`http://localhost:3000/api/v1/notifications/${id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${authToken}` },
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex items-center justify-center py-12 text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.some(n => !n.read) && (
          <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            {notifications.filter(n => !n.read).length} new
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No notifications</p>
          <p className="text-sm mt-1">You\'re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-3 ${
                notif.read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[notif.type] || 'bg-gray-100'}`}>
                <BellIcon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{notif.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{notif.body}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif.id)}
                  className="p-1 hover:bg-gray-100 rounded-lg"
                  title="Mark as read"
                >
                  <CheckIcon className="w-4 h-4 text-green-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
