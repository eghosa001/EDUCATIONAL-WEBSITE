'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Loader2, Play, Sparkles } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { sendAiTutorMessage } from '@/services/api/aiService';
import { useAuth } from '@/contexts/AuthContext';

interface Lesson { id: string; course_id: string; title: string; slug: string | null; description: string | null; learning_objectives: string[] | null; content_type: string | null; video_url: string | null; video_duration_seconds: number | null; written_content: string | null; key_points: string[] | null; order_index: number; is_free: boolean; is_published: boolean; estimated_minutes: number | null; }
interface Course { id: string; title: string; slug: string; short_description: string | null; subject_id: string | null; }

const isPlaceholder = (text: string | null | undefined) => {
  if (!text) return true;
  const t = text.trim().toLowerCase();
  return t.length < 350 || /^(tenses, parts of speech|reading strategies|speech sounds|narrative, descriptive|this lesson introduces)/i.test(t);
};

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const courseRef = String(params?.courseId || '');
  const lessonRef = String(params?.lessonId || '');
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [teaching, setTeaching] = useState(false);
  const [teacherText, setTeacherText] = useState('');
  const [activeTab, setActiveTab] = useState<'learn' | 'video' | 'resources'>('learn');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!lessonRef) return;
      setLoading(true); setError('');
      try {
        const supabase = getSupabase();
        let courseQuery = supabase.from('courses').select('id,title,slug,short_description,subject_id');
        courseQuery = /^[0-9a-f-]{36}$/i.test(courseRef) ? courseQuery.eq('id', courseRef) : courseQuery.eq('slug', courseRef);
        const { data: courseRow, error: courseError } = await courseQuery.maybeSingle();
        if (courseError) throw courseError;
        if (!courseRow) throw new Error('Course not found');
        const { data: courseLessons, error: lessonsError } = await supabase.from('lessons').select('*').eq('course_id', courseRow.id).eq('is_published', true).order('order_index', { ascending: true });
        if (lessonsError) throw lessonsError;
        const list = (courseLessons || []) as Lesson[];
        const found = list.find(l => l.id === lessonRef || l.slug === lessonRef);
        if (!found) throw new Error('Lesson not found');
        if (!cancelled) { setCourse(courseRow as Course); setLessons(list); setLesson(found); }
      } catch (e: any) { if (!cancelled) setError(e?.message || 'Unable to load lesson'); }
      finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [courseRef, lessonRef]);

  const lessonIndex = useMemo(() => lessons.findIndex(l => l.id === lesson?.id), [lessons, lesson?.id]);
  const previous = lessons[lessonIndex - 1];
  const next = lessons[lessonIndex + 1];
  const needsTeaching = isPlaceholder(lesson?.written_content);

  useEffect(() => {
    if (!lesson || !needsTeaching || !token) return;
    let cancelled = false;
    const teach = async () => {
      setTeaching(true); setTeacherText('');
      try {
        const response = await sendAiTutorMessage({
          message: `Teach this lesson as a Nigerian curriculum-aligned teacher. Lesson title: ${lesson.title}. Description: ${lesson.description || 'none'}. Existing notes: ${lesson.written_content || 'none'}. Give an accurate, age-appropriate explanation, definitions, step-by-step concepts, at least two worked examples where appropriate, common mistakes, and a short self-check. Do not invent syllabus claims. If the topic is ambiguous, explain the standard academic meaning and state assumptions.`,
          context: { lessonId: lesson.id, courseId: lesson.course_id, lessonTitle: lesson.title },
        }, token);
        if (!cancelled) setTeacherText(response.message?.content || '');
      } catch (e) { if (!cancelled) setTeacherText('The stored lesson notes are available below. The interactive teacher could not be reached right now.'); }
      finally { if (!cancelled) setTeaching(false); }
    };
    teach();
    return () => { cancelled = true; };
  }, [lesson?.id, needsTeaching, token]);

  const markComplete = async () => {
    if (!lesson || completed) return;
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) await supabase.from('lesson_progress').upsert({ user_id: userData.user.id, lesson_id: lesson.id, course_id: lesson.course_id, status: 'completed', progress_percentage: 100, completed_at: new Date().toISOString() }, { onConflict: 'user_id,lesson_id' });
      setCompleted(true);
    } catch { setCompleted(true); }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  if (error || !lesson || !course) return <div className="mx-auto max-w-2xl py-16 text-center"><h1 className="text-xl font-bold text-[#151A3A]">Unable to open lesson</h1><p className="mt-2 text-slate-500">{error || 'Lesson not found'}</p><Link href="/dashboard/lessons" className="mt-6 inline-flex rounded-xl bg-[#151A3A] px-5 py-2.5 font-semibold text-white">Back to lessons</Link></div>;

  const goTo = (target?: Lesson) => { if (target) router.push(`/dashboard/lessons/${course.slug || course.id}/${target.slug || target.id}`); };
  const notes = lesson.written_content || lesson.description || 'No written notes have been added yet.';

  return <div className="space-y-6">
    <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/dashboard/lessons" className="hover:text-brand-700">Lessons</Link><ChevronRight className="h-4 w-4" /><span className="truncate text-slate-900">{lesson.title}</span></div>
    <header className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><p className="text-xs font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">{course.title}</p><h1 className="mt-2 text-3xl font-extrabold text-[#151A3A] dark:text-white">{lesson.title}</h1>{lesson.description && <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">{lesson.description}</p>}<div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{lesson.estimated_minutes || Math.ceil((lesson.video_duration_seconds || 0) / 60) || 10} min</span>{lesson.is_free && <span className="font-medium text-emerald-600">Free</span>}</div></header>

    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><div className="flex border-b border-stone-200 dark:border-slate-700">{(['learn','video','resources'] as const).map(tab => <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-4 py-3 text-sm font-semibold ${activeTab === tab ? 'border-b-2 border-brand-600 text-brand-700 dark:text-brand-300' : 'text-slate-500'}`}>{tab === 'learn' ? 'Learn' : tab === 'video' ? 'Video' : 'Resources'}</button>)}</div>
      {activeTab === 'learn' && <div className="p-6 sm:p-8">
        <section className="mb-8"><h2 className="text-xl font-bold text-[#151A3A] dark:text-white">What you will learn</h2><ul className="mt-4 space-y-2">{(lesson.learning_objectives?.length ? lesson.learning_objectives : [`Understand ${lesson.title}`, `Apply the ideas in ${lesson.title}`, `Check your understanding with examples`]).map((x, i) => <li key={i} className="flex gap-2 text-slate-600 dark:text-slate-300"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />{x}</li>)}</ul></section>
        {needsTeaching && <div className="mb-8 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-900 dark:bg-brand-950/30"><div className="flex items-center gap-2 font-semibold text-brand-900 dark:text-brand-200"><Sparkles className="h-5 w-5" />Interactive teacher</div>{teaching ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Preparing the explanation…</div> : <div className="prose prose-sm mt-4 max-w-none whitespace-pre-wrap text-slate-700 dark:text-slate-200">{teacherText || 'Open the AI Tutor for a detailed explanation of this lesson.'}</div>}</div>}
        <section><h2 className="text-xl font-bold text-[#151A3A] dark:text-white">Lesson notes</h2><div className="mt-4 whitespace-pre-wrap leading-7 text-slate-700 dark:text-slate-200">{notes}</div></section>
        {!!lesson.key_points?.length && <section className="mt-8"><h2 className="text-xl font-bold text-[#151A3A] dark:text-white">Key points</h2><ul className="mt-4 list-disc space-y-2 pl-6 text-slate-700 dark:text-slate-200">{lesson.key_points.map((x, i) => <li key={i}>{x}</li>)}</ul></section>}
      </div>}
      {activeTab === 'video' && <div className="p-6">{lesson.video_url ? <video ref={videoRef} controls className="aspect-video w-full rounded-xl bg-black" src={lesson.video_url} /> : <div className="flex aspect-video items-center justify-center rounded-xl bg-stone-100 text-slate-500 dark:bg-slate-900">No video has been uploaded for this lesson yet.</div>}</div>}
      {activeTab === 'resources' && <div className="p-6 text-sm text-slate-500"><div className="flex items-center gap-2"><Download className="h-5 w-5" />Resources are shown here when attached to this lesson.</div></div>}
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3"><button disabled={!previous} onClick={() => goTo(previous)} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Previous</button><button onClick={markComplete} disabled={completed} className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold ${completed ? 'bg-emerald-100 text-emerald-700' : 'bg-[#151A3A] text-white hover:bg-[#202750]'}`}><CheckCircle2 className="h-4 w-4" />{completed ? 'Completed' : 'Mark as complete'}</button><button disabled={!next} onClick={() => goTo(next)} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40">Next<ChevronRight className="h-4 w-4" /></button></div>
  </div>;
}
