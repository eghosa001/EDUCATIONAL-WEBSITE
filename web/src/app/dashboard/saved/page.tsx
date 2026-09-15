'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookmarkIcon, BookOpenIcon } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/state/auth/authStore';

interface SavedCourse { id:string; slug:string; title:string; shortDescription?:string; bookmarkedAt:string; }

export default function SavedPage() {
  const { token } = useAuthStore();
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        setLoading(true); setError('');
        const user = (await getSupabase().auth.getUser()).data.user;
        if (!user) throw new Error('You must be signed in');
        const { data, error } = await getSupabase()
          .from('bookmarks')
          .select('id,created_at,course_id,courses:course_id(id,slug,title,short_description)')
          .eq('user_id', user.id)
          .not('course_id', 'is', null)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (!cancelled) setSavedCourses((data || []).flatMap((row:any) => row.courses ? [{ id: row.courses.id, slug: row.courses.slug, title: row.courses.title, shortDescription: row.courses.short_description || undefined, bookmarkedAt: row.created_at }] : []));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load saved items');
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" /></div>;
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold text-gray-900">Saved Items</h1><p className="mt-1 text-gray-500">Your bookmarked courses</p></div>{error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}{savedCourses.length===0?<div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500"><BookmarkIcon className="mx-auto mb-4 h-12 w-12 text-gray-300"/><p className="font-medium">No saved items yet</p><p className="mt-1 text-sm">Courses you bookmark will appear here.</p><Link href="/dashboard/courses" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Browse Courses</Link></div>:<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{savedCourses.map(course=><Link key={course.id} href={`/dashboard/courses/${course.slug}`} className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-md"><div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200"><BookOpenIcon className="h-8 w-8 text-blue-400"/></div><h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{course.title}</h3><p className="mt-1 line-clamp-2 text-sm text-gray-500">{course.shortDescription || 'Continue learning from this saved course.'}</p></Link>)}</div>}</div>;
}
