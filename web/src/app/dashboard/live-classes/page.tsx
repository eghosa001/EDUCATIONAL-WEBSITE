'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { VideoIcon, CalendarIcon, UsersIcon, ClockIcon, PlusIcon, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchLiveClasses, joinLiveClass, type LiveClass } from '@/features/liveClasses/service';

export default function LiveClassesPage() {
  const { token, user } = useAuthStore();
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live' | 'recorded'>('all');
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    try {
      const stored = JSON.parse(window.localStorage.getItem('live-class-reminders') || '[]');
      setReminders(new Set(Array.isArray(stored) ? stored : []));
    } catch { setReminders(new Set()); }
    fetchLiveClasses({ page: 1, limit: 50 }, token)
      .then(res => setClasses((res.data as LiveClass[]) || []))
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load live classes'))
      .finally(() => setLoading(false));
  }, [token]);

  const counts = useMemo(() => ({
    upcoming: classes.filter(c => c.status === 'scheduled').length,
    live: classes.filter(c => c.status === 'live').length,
    recorded: classes.filter(c => c.status === 'ended').length,
  }), [classes]);

  const filtered = filter === 'all' ? classes : classes.filter(c => {
    if (filter === 'upcoming') return c.status === 'scheduled';
    if (filter === 'live') return c.status === 'live';
    return c.status === 'ended';
  });

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleReminder = (id: string) => {
    setReminders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      window.localStorage.setItem('live-class-reminders', JSON.stringify([...next]));
      return next;
    });
  };

  const handleJoin = async (classItem: LiveClass) => {
    if (!token || joiningId) return;
    setJoiningId(classItem.id);
    setError('');
    try {
      const result = await joinLiveClass(classItem.id, token);
      const url = result.data?.meetingUrl || classItem.meetingUrl;
      if (!url) throw new Error('The teacher has not provided a meeting link yet.');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to join this class');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Live Classes</h1><p className="mt-1 text-gray-500">Join live sessions with your teachers</p></div>
        {user?.role === 'teacher' && <Link href="/dashboard/live-classes/create" className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"><PlusIcon className="h-4 w-4"/>Schedule Class</Link>}
      </div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex flex-wrap gap-2">
        {(['all','upcoming','live','recorded'] as const).map(f => {
          const count = f === 'all' ? classes.length : counts[f];
          return <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-4 py-2 text-sm font-medium ${filter===f?'bg-blue-600 text-white':'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'}`}>{f.charAt(0).toUpperCase()+f.slice(1)} <span className="ml-1 text-xs opacity-75">({count})</span></button>;
        })}
      </div>

      {loading ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{[1,2,3].map(i=><div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5"><div className="mb-3 h-4 w-3/4 rounded bg-gray-200"/><div className="mb-2 h-3 w-full rounded bg-gray-100"/><div className="h-3 w-2/3 rounded bg-gray-100"/></div>)}</div> : filtered.length===0 ? (
        <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500"><VideoIcon className="mx-auto mb-4 h-12 w-12 text-gray-300"/><p className="font-medium">No live classes found</p><p className="mt-1 text-sm">{filter==='live'?'No classes are currently live':'Check back later for upcoming classes'}</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(classItem => (
            <div key={classItem.id} className="rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-blue-300 hover:shadow-md">
              <div className="mb-3 flex items-start justify-between"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${classItem.status==='live'?'bg-red-100 text-red-700':classItem.status==='scheduled'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-600'}`}>{classItem.status==='live'?'● LIVE':classItem.status==='scheduled'?'UPCOMING':'ENDED'}</span>{Number(classItem.studentCount)>0&&<span className="flex items-center gap-1 text-xs text-gray-400"><UsersIcon className="h-3 w-3"/>{classItem.studentCount}</span>}</div>
              <h3 className="font-semibold text-gray-900">{classItem.title}</h3>
              {classItem.subjectTitle&&<p className="mt-1 text-sm text-gray-500">{classItem.subjectTitle}</p>}
              {classItem.description&&<p className="mt-2 line-clamp-3 text-sm text-gray-500">{classItem.description}</p>}
              <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-xs text-gray-500"><span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3"/>{formatTime(classItem.scheduledAt)}</span><span className="flex items-center gap-1"><ClockIcon className="h-3 w-3"/>{classItem.durationMinutes}m</span></div>
              {classItem.teacherName&&<p className="mt-2 text-xs text-gray-400">Teacher: {classItem.teacherName}</p>}
              <div className="mt-4 flex gap-2">
                {classItem.status==='live'&&<button onClick={() => void handleJoin(classItem)} disabled={joiningId===classItem.id} className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">{joiningId===classItem.id?'Joining…':'Join Now'}</button>}
                {classItem.status==='scheduled'&&<button onClick={() => toggleReminder(classItem.id)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${reminders.has(classItem.id)?'border border-green-200 bg-green-50 text-green-700':'bg-blue-600 text-white hover:bg-blue-700'}`}>{reminders.has(classItem.id)?<span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4"/>Reminder set</span>:'Remind Me'}</button>}
                {classItem.status==='ended'&&classItem.meetingUrl&&<a href={classItem.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-center text-sm text-blue-600 hover:bg-blue-50">Watch Recording</a>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
