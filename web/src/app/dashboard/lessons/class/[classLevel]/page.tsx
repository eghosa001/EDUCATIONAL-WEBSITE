'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronDown, ChevronRight, GraduationCap, Loader2, Search } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

type Course = { id: string; title: string; slug: string; subject_id: string | null; term_id: string | null; short_description: string | null; lesson_count: number | null; };
type Subject = { id: string; name: string; code: string | null; order_index: number; icon: string | null; };
type Term = { id: string; name: string; code: string | null; order_index: number; };
type SubjectGroup = { subject: Subject | null; courses: Course[] };

const classMeta: Record<string, { title: string; subtitle: string; icon: string }> = {
  'primary-1': { title: 'Primary 1', subtitle: 'Build strong foundations through guided teaching and practice.', icon: '📚' },
  'primary-2': { title: 'Primary 2', subtitle: 'Strengthen core skills with progressive learning.', icon: '📘' },
  'primary-3': { title: 'Primary 3', subtitle: 'Learn concepts clearly and practise often.', icon: '✏️' },
  'primary-4': { title: 'Primary 4', subtitle: 'Develop deeper understanding across subjects.', icon: '🧠' },
  'primary-5': { title: 'Primary 5', subtitle: 'Master key concepts and prepare for the next stage.', icon: '🎯' },
  'primary-6': { title: 'Primary 6', subtitle: 'Consolidate the primary learning journey.', icon: '🏆' },
  'jss-1': { title: 'JSS 1', subtitle: 'Start junior secondary learning subject by subject.', icon: '🎓' },
  'jss-2': { title: 'JSS 2', subtitle: 'Build on knowledge with increasingly challenging work.', icon: '📖' },
  'jss-3': { title: 'JSS 3', subtitle: 'Strengthen your foundation and prepare for senior school.', icon: '🚀' },
  'ss-1': { title: 'SS 1', subtitle: 'Build a strong senior secondary foundation.', icon: '🔬' },
  'ss-2': { title: 'SS 2', subtitle: 'Deepen concepts and examination skills.', icon: '📐' },
  'ss-3': { title: 'SS 3', subtitle: 'Complete senior secondary preparation.', icon: '🏅' },
};

function canonicalClass(value: string) {
  const compact = value.toLowerCase().replace(/class\s*[ab]$/i, '').replace(/[^a-z0-9]/g, '');
  const primary = compact.match(/^(?:primary|p)([1-6])$/); if (primary) return `primary-${primary[1]}`;
  const jss = compact.match(/^jss([1-3])$/); if (jss) return `jss-${jss[1]}`;
  const ss = compact.match(/^sss?([1-3])$/); if (ss) return `ss-${ss[1]}`;
  return compact;
}

function termName(course: Course, terms: Term[]) {
  return terms.find(t => t.id === course.term_id)?.name || course.title.match(/(First|Second|Third) Term/i)?.[0] || 'Teaching material';
}

export default function ClassCurriculumPage() {
  const { classLevel } = useParams();
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const key = String(classLevel || '').toLowerCase();
  const meta = classMeta[key];
  const [groups, setGroups] = useState<SubjectGroup[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!meta || authLoading) return;
    if (!isAuthenticated) { setLoading(false); setError('Please sign in to access the curriculum.'); return; }
    let cancelled = false;
    (async () => {
      setLoading(true); setError('');
      try {
        const supabase = getSupabase();
        const { data: classes, error: classError } = await supabase.from('classes').select('id,name,code').eq('is_active', true);
        if (classError) throw classError;
        const target = canonicalClass(key);
        const classIds = (classes || []).filter((row: any) => canonicalClass(String(row.name)) === target || canonicalClass(String(row.code || '')) === target).map((row: any) => row.id);
        if (!classIds.length) throw new Error(`No database class is mapped to ${meta.title}.`);

        const [{ data: courseRows, error: courseError }, { data: subjectRows, error: subjectError }, { data: termRows, error: termError }] = await Promise.all([
          supabase.from('courses').select('id,title,slug,subject_id,term_id,short_description,lesson_count').in('class_id', classIds).eq('status', 'published').order('title'),
          supabase.from('subjects').select('id,name,code,order_index,icon').eq('is_active', true).order('order_index'),
          supabase.from('terms').select('id,name,code,order_index').eq('is_active', true).order('order_index'),
        ]);
        if (courseError) throw courseError;
        if (subjectError) throw subjectError;
        if (termError) throw termError;

        const subjectMap = new Map((subjectRows || []).map((s: any) => [s.id, s as Subject]));
        const map = new Map<string, SubjectGroup>();
        (courseRows || []).forEach((course: any) => {
          const subject = subjectMap.get(course.subject_id) || null;
          const groupKey = subject?.id || `unassigned-${course.id}`;
          if (!map.has(groupKey)) map.set(groupKey, { subject, courses: [] });
          map.get(groupKey)!.courses.push(course as Course);
        });
        const nextGroups = Array.from(map.values()).sort((a, b) => (a.subject?.order_index ?? 999) - (b.subject?.order_index ?? 999));
        if (!cancelled) { setGroups(nextGroups); setTerms((termRows || []) as Term[]); if (nextGroups[0]?.subject) setOpenSubject(nextGroups[0].subject.id); }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Unable to load this class curriculum.');
      } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [key, meta, authLoading, isAuthenticated]);

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.map(group => ({ ...group, courses: group.courses.filter(c => `${group.subject?.name || ''} ${c.title} ${c.short_description || ''}`.toLowerCase().includes(q)) })).filter(group => group.courses.length);
  }, [groups, search]);

  if (!meta) return <div className="p-10 text-center">Class not found.</div>;
  if (authLoading || loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#151A3A]" /></div>;
  if (!isAuthenticated) return <div className="mx-auto max-w-2xl py-16 text-center"><h1 className="text-xl font-bold text-[#151A3A] dark:text-white">Sign in to continue</h1><p className="mt-2 text-slate-500">Please sign in to access your curriculum.</p><Link href="/login" className="mt-6 inline-flex rounded-xl bg-[#151A3A] px-5 py-2.5 font-semibold text-white">Sign in</Link></div>;

  const courseCount = filteredGroups.reduce((n, g) => n + g.courses.length, 0);
  return (
    <div className="space-y-7">
      <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4" />All classes</Link>
      <section className="overflow-hidden rounded-3xl bg-[#151A3A] p-7 text-white shadow-xl sm:p-9">
        <div className="flex items-end justify-between gap-5"><div><div className="text-4xl">{meta.icon}</div><p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">THE GUIDE CURRICULUM</p><h1 className="mt-2 text-4xl font-extrabold">{meta.title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{meta.subtitle}</p></div><GraduationCap className="hidden h-14 w-14 text-white/70 sm:block" /></div>
      </section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-2xl font-extrabold text-[#151A3A] dark:text-white">Subjects</h2><p className="mt-1 text-sm text-slate-500">Choose a subject to open its teaching materials by term.</p></div><div className="relative w-full sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects or materials…" className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#151A3A] dark:border-slate-700 dark:bg-[#1b2045] dark:text-white" /></div></div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!error && !filteredGroups.length && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#1b2045]"><BookOpen className="mx-auto h-10 w-10 text-stone-300" /><h3 className="mt-3 font-bold text-[#151A3A] dark:text-white">No published teaching materials found</h3><p className="mt-1 text-sm text-slate-500">No published courses are linked to {meta.title} in Supabase.</p></div>}
      {!!filteredGroups.length && <div className="space-y-3">{filteredGroups.map(group => { const subjectKey = group.subject?.id || group.courses[0]?.id || 'unassigned'; const isOpen = openSubject === subjectKey; return <section key={subjectKey} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><button onClick={() => setOpenSubject(isOpen ? null : subjectKey)} className="flex w-full items-center gap-4 p-5 text-left hover:bg-stone-50 dark:hover:bg-[#151A3A]"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl dark:bg-slate-800">{group.subject?.icon || '📘'}</span><span className="min-w-0 flex-1"><span className="block text-lg font-extrabold text-[#151A3A] dark:text-white">{group.subject?.name || 'Other teaching materials'}</span><span className="mt-0.5 block text-sm text-slate-500">{group.courses.length} published course{group.courses.length === 1 ? '' : 's'} · First, Second and Third Term materials where available</span></span>{isOpen ? <ChevronDown className="h-5 w-5 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}</button>{isOpen && <div className="border-t border-stone-100 p-4 dark:border-slate-700"><div className="grid gap-3 md:grid-cols-3">{group.courses.sort((a,b) => (terms.find(t=>t.id===a.term_id)?.order_index ?? 999) - (terms.find(t=>t.id===b.term_id)?.order_index ?? 999)).map(course => <Link key={course.id} href={`/dashboard/courses/${course.slug || course.id}`} className="group rounded-xl border border-stone-200 p-4 transition hover:-translate-y-0.5 hover:border-[#151A3A]/30 hover:shadow-md dark:border-slate-700"><div className="flex items-start justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">{termName(course, terms)}</span><h4 className="mt-1 font-bold text-[#151A3A] dark:text-white">{course.title}</h4></div><ChevronRight className="h-5 w-5 shrink-0 text-slate-300 group-hover:text-[#151A3A]" /></div><p className="mt-3 text-xs font-semibold text-slate-500">{course.lesson_count || 0} teaching lessons</p><p className="mt-3 text-xs font-bold text-[#151A3A] dark:text-slate-200">Open teaching materials →</p></Link>)}</div></div>}</section>; })}</div>}
      {!!filteredGroups.length && <p className="text-center text-xs text-slate-400">{courseCount} published course materials available for {meta.title}.</p>}
    </div>
  );
}
