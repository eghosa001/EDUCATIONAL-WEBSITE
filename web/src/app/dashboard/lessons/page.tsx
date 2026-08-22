'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, Clock3, FolderOpen, Loader2, Play } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Lesson { id: string; course_id: string; title: string; slug: string | null; description: string | null; is_published: boolean; estimated_minutes: number | null; order_index: number; }
interface Course { id: string; title: string; slug: string; lessons: Lesson[]; }

export default function LessonsPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const supabase = getSupabase();
        const { data: courseRows, error: courseError } = await supabase.from('courses').select('id,title,slug').eq('status','published').order('title');
        if (courseError) throw courseError;
        const ids = (courseRows || []).map((c: any) => c.id);
        const { data: lessonRows, error: lessonError } = ids.length ? await supabase.from('lessons').select('id,course_id,title,slug,description,is_published,estimated_minutes,order_index').in('course_id', ids).eq('is_published', true).order('order_index') : { data: [], error: null } as any;
        if (lessonError) throw lessonError;
        const byCourse = new Map<string, Lesson[]>();
        (lessonRows || []).forEach((lesson: Lesson) => { const list = byCourse.get(lesson.course_id) || []; list.push(lesson); byCourse.set(lesson.course_id, list); });
        const result = (courseRows || []).map((c: any) => ({ ...c, lessons: byCourse.get(c.id) || [] })).filter((c: Course) => c.lessons.length);
        if (!cancelled) setCourses(result);
      } catch (e: any) { if (!cancelled) setError(e?.message || 'Unable to load lessons'); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); if (!q) return courses; return courses.map(c => ({ ...c, lessons: c.lessons.filter(l => `${l.title} ${l.description || ''} ${c.title}`.toLowerCase().includes(q)) })).filter(c => c.lessons.length); }, [courses, search]);
  const total = courses.reduce((n,c)=>n+c.lessons.length,0);

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  return <div className="space-y-6"><div><h1 className="text-2xl font-extrabold text-[#151A3A] dark:text-white">Lessons</h1><p className="mt-1 text-slate-500">{total} published lessons across {courses.length} courses</p></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search lessons or courses…" className="w-full max-w-xl rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />{error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}{filtered.length===0 ? <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center"><BookOpen className="mx-auto h-12 w-12 text-slate-300"/><h2 className="mt-4 font-semibold">{search?'No lessons found':'No published lessons yet'}</h2><Link href="/dashboard/courses" className="mt-5 inline-flex rounded-xl bg-[#151A3A] px-5 py-2.5 text-sm font-semibold text-white">Browse courses</Link></div> : <div className="space-y-6">{filtered.map(course=><section key={course.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><div className="flex items-center gap-3 border-b border-stone-200 bg-stone-50 px-5 py-4 dark:border-slate-700 dark:bg-[#151A3A]"><FolderOpen className="h-5 w-5 text-brand-600"/><h2 className="font-bold text-[#151A3A] dark:text-white">{course.title}</h2><span className="ml-auto text-xs text-slate-500">{course.lessons.length} lessons</span></div><div className="divide-y divide-stone-100 dark:divide-slate-700">{course.lessons.map((lesson,i)=><Link key={lesson.id} href={`/dashboard/lessons/${course.slug || course.id}/${lesson.slug || lesson.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-brand-50/60 dark:hover:bg-slate-800"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-slate-600">{i+1}</span><Play className="h-4 w-4 shrink-0 text-brand-600"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{lesson.title}</p><p className="truncate text-xs text-slate-500">{lesson.description || 'Open this lesson to learn the topic.'}</p></div><span className="hidden items-center gap-1 text-xs text-slate-400 sm:flex"><Clock3 className="h-3 w-3"/>{lesson.estimated_minutes || 10} min</span><CheckCircle2 className="h-4 w-4 text-emerald-500"/></Link>)}</div></section>)}</div>}</div>;
}
