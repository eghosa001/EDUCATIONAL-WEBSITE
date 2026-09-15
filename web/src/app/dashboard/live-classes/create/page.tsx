'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { createLiveClass } from '@/features/liveClasses/service';

export default function CreateLiveClassPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || user?.role !== 'teacher' || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await createLiveClass({
        title: title.trim(),
        description: description.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMinutes,
        meetingUrl: meetingUrl.trim(),
      }, token);
      router.push('/dashboard/live-classes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to schedule live class');
    } finally {
      setSubmitting(false);
    }
  };

  if (user && user.role !== 'teacher') {
    return <div className="mx-auto max-w-xl py-16 text-center"><h1 className="text-2xl font-bold text-gray-900">Teacher access required</h1><p className="mt-2 text-gray-500">Only teachers can schedule live classes.</p><Link href="/dashboard/live-classes" className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Back to live classes</Link></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/dashboard/live-classes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"><ArrowLeft className="h-4 w-4"/>Back to live classes</Link>
      <div><h1 className="text-2xl font-bold text-gray-900">Schedule Live Class</h1><p className="mt-1 text-gray-500">Create a session and provide the meeting link students will use to join.</p></div>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div><label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="title">Class title</label><input id="title" required minLength={3} maxLength={300} value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"/></div>
        <div><label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="description">Description</label><textarea id="description" rows={4} value={description} onChange={e=>setDescription(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"/></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="scheduledAt">Date & time</label><input id="scheduledAt" type="datetime-local" required value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"/></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="duration">Duration (minutes)</label><input id="duration" type="number" min={1} max={600} required value={durationMinutes} onChange={e=>setDurationMinutes(Number(e.target.value))} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"/></div>
        </div>
        <div><label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="meetingUrl">Meeting URL</label><input id="meetingUrl" type="url" required value={meetingUrl} onChange={e=>setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..." className="w-full rounded-xl border border-gray-300 px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500"/></div>
        <button type="submit" disabled={submitting || !token} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{submitting&&<Loader2 className="h-4 w-4 animate-spin"/>}{submitting?'Scheduling…':'Schedule class'}</button>
      </form>
    </div>
  );
}
