'use client';

import { useEffect, useState } from 'react';
import { ClockIcon, BookOpenIcon, PlayIcon, FileTextIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { apiConfig, getAuthHeaders } from '@/services/api/config';

export default function RecentPage() {
  const { token } = useAuthStore();
  const authToken = token ?? undefined;
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) { setLoading(false); return; }
    
    fetch(`${apiConfig.baseUrl}/progress/lessons?limit=10`, {
      headers: getAuthHeaders(authToken),
    })
      .then(res => res.json())
      .then(data => {
        const recent = (data.data || []).map((p: any) => ({
          id: p.lesson_id,
          title: p.lesson?.title || 'Lesson',
          type: 'lesson',
          time: new Date(p.updated_at).toLocaleString(),
        }));
        setItems(recent);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [authToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Recent Activity</h1>
        <div className="flex items-center gap-2 text-gray-500 py-8 justify-center">
          <ClockIcon className="w-5 h-5 animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recent Activity</h1>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No recent activity</p>
          <p className="text-sm mt-1">Start learning to see your progress here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpenIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.time}</p>
              </div>
              <PlayIcon className="w-5 h-5 text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
