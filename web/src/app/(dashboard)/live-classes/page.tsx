'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { VideoIcon, CalendarIcon, UsersIcon, ClockIcon, PlusIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';

interface LiveClass {
  id: string;
  title: string;
  description?: string;
  subjectTitle?: string;
  teacherName?: string;
  scheduledAt: string;
  durationMinutes: number;
  status: 'scheduled' | 'live' | 'ended';
  meetingUrl?: string;
  studentCount?: number;
}

export default function LiveClassesPage() {
  const { token, user } = useAuthStore();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'recorded'>('all');

  useEffect(() => {
    if (!token) return;
    // Use schoolService as fallback since there's no dedicated live classes service yet
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/live-classes${user?.role === 'teacher' ? '/my' : ''}?page=1&limit=20`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setClasses(data.data?.classes || []))
      .catch(() => setClasses([]))
      .finally(() => setLoading(false));
  }, [token, user]);

  const filtered = filter === 'all' ? classes : classes.filter(c => {
    if (filter === 'upcoming') return c.status === 'scheduled';
    if (filter === 'live') return c.status === 'live';
    if (filter === 'recorded') return c.status === 'ended';
    return true;
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Classes</h1>
          <p className="text-gray-500 mt-1">Join live sessions with your teachers</p>
        </div>
        {user?.role === 'teacher' && (
          <Link
            href="/dashboard/live-classes/create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" /> Schedule Class
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'upcoming', 'live', 'recorded'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && <span className="ml-1 text-xs opacity-75">({filtered.length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-full mb-2" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <VideoIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No live classes found</p>
          <p className="text-sm mt-1">
            {filter === 'live' ? 'No classes are currently live' : 'Check back later for upcoming classes'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(classItem => (
            <div
              key={classItem.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  classItem.status === 'live' ? 'bg-red-100 text-red-700' :
                  classItem.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {classItem.status === 'live' ? '● LIVE' : classItem.status === 'scheduled' ? 'UPCOMING' : 'ENDED'}
                </span>
                {classItem.studentCount && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <UsersIcon className="w-3 h-3" /> {classItem.studentCount}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900">{classItem.title}</h3>
              {classItem.subjectTitle && (
                <p className="text-sm text-gray-500 mt-1">{classItem.subjectTitle}</p>
              )}
              {classItem.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{classItem.description}</p>
              )}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {formatTime(classItem.scheduledAt)}</span>
                <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {classItem.durationMinutes}m</span>
              </div>
              {classItem.teacherName && (
                <p className="text-xs text-gray-400 mt-2">Teacher: {classItem.teacherName}</p>
              )}
              <div className="mt-4 flex gap-2">
                {classItem.status === 'live' && (
                  <button className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                    Join Now
                  </button>
                )}
                {classItem.status === 'scheduled' && (
                  <>
                    <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                      Remind Me
                    </button>
                    <Link href={`/dashboard/live-classes/${classItem.id}`} className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Details
                    </Link>
                  </>
                )}
                {classItem.status === 'ended' && classItem.meetingUrl && (
                  <a
                    href={classItem.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 text-center"
                  >
                    Watch Recording
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
