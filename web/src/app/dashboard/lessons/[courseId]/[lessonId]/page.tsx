'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Loader2, Sparkles } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { fetchPrebuiltFlashcards, sendAiTutorMessage } from '@/services/api/aiService';
import { fetchCachedJson, getLearnerApiHeaders, handleApiResponse, learnerApiConfig } from '@/services/api/config';
import { useAuth } from '@/contexts/AuthContext';
import { startStudySession, endStudySession } from '@/services/api/progressService';

type Tab = 'learn' | 'flashcards' | 'practice' | 'video' | 'resources';
type Question = { id: string; question_text: string; options: any; difficulty?: string | null; marks?: number | null; question_image_url?: string | null; generated?: boolean; serverPractice?: boolean; practiceIndex?: number; correct_answer?: any; explanation?: string | null };
type CheckResult = { isCorrect: boolean; correctAnswer: unknown; explanation: string | null; explanationImageUrl?: string | null };

const COURSE_ROUTE_COLUMNS = 'id,title,slug,short_description,subject_id,class_id,term_id,status';
const LESSON_ROUTE_COLUMNS = 'id,course_id,topic_id,slug,title,description,written_content,learning_objectives,key_points,estimated_minutes,video_url,video_duration_seconds,content_type,is_free,is_published,order_index';
const LESSON_NAV_COLUMNS = 'id,course_id,topic_id,slug,title,estimated_minutes,is_published,order_index';
const LESSON_ROUTE_CACHE_TTL_MS = 2 * 60 * 1000;

function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function safeDecode(value: string) { try { return decodeURIComponent(value); } catch { return value; } }
function optionsOf(v: any) { return Array.isArray(v) ? v.map((x: any, i: number) => ({ id: String(x?.id ?? x?.label ?? String.fromCharCode(65 + i)), text: String(x?.text ?? x?.value ?? x) })) : v && typeof v === 'object' ? Object.entries(v).map(([id, x]: any) => ({ id, text: String(x?.text ?? x?.value ?? x) })) : []; }
function answerOf(v: any) { return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' ? String(v) : v && typeof v === 'object' ? String(v.id ?? v.label ?? v.answer ?? v.value ?? '') : ''; }
function asArray(value: unknown) { return Array.isArray(value) ? value.map(item => String(item || '').trim()).filter(Boolean) : []; }
function cacheKey(courseRef: string, lessonRef: string) { return `the-guide:lesson-route:${courseRef}:${lessonRef}`; }
function readCachedLesson(courseRef: string, lessonRef: string) { if (typeof window === 'undefined') return null; try { const raw = window.sessionStorage.getItem(cacheKey(courseRef, lessonRef)); if (!raw) return null; const parsed = JSON.parse(raw); if (!parsed?.savedAt || Date.now() - Number(parsed.savedAt) > LESSON_ROUTE_CACHE_TTL_MS) return null; return parsed.data || null; } catch { return null; } }
function writeCachedLesson(courseRef: string, lessonRef: string, data: any) { if (typeof window === 'undefined') return; try { window.sessionStorage.setItem(cacheKey(courseRef, lessonRef), JSON.stringify({ savedAt: Date.now(), data })); } catch { /* cache is optional */ } }

function LessonContent({ content }: { content: string }) {
  const safe = String(content || '').trim();
  if (!safe) return <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-slate-500">No written lesson content is available yet.</div>;

  // react-markdown renders ordinary Markdown and GFM tables safely by default;
  // unlike the earlier paragraph splitter it preserves ordered steps, exact
  // quotes, strong/emphasis, lists and original model passages for every lesson.
  // HTML from the database is not interpreted as executable markup.
  return <article className="lesson-prose min-w-0 text-[16px] leading-8 text-slate-700 dark:text-slate-200">
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      h1: ({ children }) => <h2 className="mb-4 mt-7 text-2xl font-extrabold leading-snug text-[#151A3A] dark:text-white">{children}</h2>,
      h2: ({ children }) => <h3 className="mb-3 mt-8 text-xl font-bold leading-snug text-[#151A3A] dark:text-white">{children}</h3>,
      h3: ({ children }) => <h4 className="mb-2 mt-6 text-lg font-bold text-[#151A3A] dark:text-white">{children}</h4>,
      h4: ({ children }) => <h5 className="mb-2 mt-5 font-bold text-[#151A3A] dark:text-white">{children}</h5>,
      p: ({ children }) => <p className="mb-5 break-words leading-8">{children}</p>,
      ul: ({ children }) => <ul className="mb-6 ml-5 list-disc space-y-2 pl-2">{children}</ul>,
      ol: ({ children }) => <ol className="mb-6 ml-5 list-decimal space-y-2 pl-2">{children}</ol>,
      li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
      strong: ({ children }) => <strong className="font-extrabold text-slate-900 dark:text-white">{children}</strong>,
      blockquote: ({ children }) => <blockquote className="mb-6 rounded-r-xl border-l-4 border-brand-500 bg-brand-50 p-4 italic text-slate-800 dark:bg-[#202650] dark:text-slate-100">{children}</blockquote>,
      table: ({ children }) => <div className="mb-6 max-w-full overflow-x-auto rounded-xl border border-stone-200 dark:border-slate-700" role="region" aria-label="Lesson reference table" tabIndex={0}><table className="w-full min-w-[440px] border-collapse text-left text-sm">{children}</table></div>,
      thead: ({ children }) => <thead className="bg-[#151A3A] text-white">{children}</thead>,
      th: ({ children }) => <th className="border-b border-slate-200 px-4 py-3 text-left font-bold">{children}</th>,
      td: ({ children }) => <td className="border-b border-stone-200 px-4 py-3 align-top dark:border-slate-700">{children}</td>,
      a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="break-words font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-900 dark:text-brand-300">{children}</a>,
      pre: ({ children }) => <pre className="mb-6 max-w-full overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm leading-6 text-slate-100">{children}</pre>,
      code: ({ children }) => <code className="break-words rounded bg-stone-100 px-1 py-0.5 font-mono text-[0.875em] dark:bg-[#202650]">{children}</code>,
    }}>{safe}</ReactMarkdown>
  </article>;
}

function LessonVisualMap({ title, objectives, keyPoints }: { title: string; objectives: unknown; keyPoints: unknown }) {
  const nodes = [...asArray(objectives).slice(0, 2), ...asArray(keyPoints).slice(0, 3)].slice(0, 5);
  if (nodes.length < 2) return null;
  return <section className="mt-10 rounded-3xl border border-stone-200 bg-gradient-to-br from-white to-stone-50 p-6 shadow-sm dark:border-slate-700 dark:from-[#1b2045] dark:to-[#151A3A]"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Visual summary</p><h2 className="mt-1 text-xl font-extrabold text-[#151A3A] dark:text-white">{title}</h2></div><span className="rounded-full bg-[#151A3A] px-3 py-1 text-xs font-bold text-white">Concept map</span></div><ol className="mt-7 space-y-4">{nodes.map((node, index) => <li key={index} className="grid gap-3 sm:grid-cols-[42px_1fr] sm:items-start"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#151A3A] text-sm font-extrabold text-white shadow">{index + 1}</div><div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-[#202650] dark:text-slate-200">{node}</div></li>)}</ol></section>;
}

function LessonQuickReference({ objectives, keyPoints }: { objectives: unknown; keyPoints: unknown }) {
  const rows = [...asArray(keyPoints), ...asArray(objectives)].filter((value, index, values) => values.findIndex(item => item.toLowerCase() === value.toLowerCase()) === index).slice(0, 4);
  if (!rows.length) return null;
  return <section className="mt-10"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Quick reference</p><h2 className="mt-1 text-xl font-extrabold text-[#151A3A] dark:text-white">Lesson summary table</h2><div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 shadow-sm dark:border-slate-700"><table className="w-full min-w-[520px] border-collapse text-left text-sm"><thead className="bg-[#151A3A] text-white"><tr><th className="w-36 px-4 py-3 font-extrabold">Focus</th><th className="px-4 py-3 font-extrabold">What to remember</th></tr></thead><tbody className="divide-y divide-stone-200 bg-white dark:divide-slate-700 dark:bg-[#1b2045]">{rows.map((row, index) => <tr key={index}><td className="px-4 py-3 font-bold text-[#151A3A] dark:text-white">Point {index + 1}</td><td className="px-4 py-3 leading-6 text-slate-700 dark:text-slate-200">{row}</td></tr>)}</tbody></table></div></section>;
}

function LessonResourceVisuals({ resources }: { resources: any[] }) {
  const visuals = resources.filter(resource => resource?.resource_type === 'visual-summary' || String(resource?.mime_type || '').startsWith('image/'));
  if (!visuals.length) return null;
  return <section className="mt-10"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-slate-400">Visual learning aid</p><h2 className="mt-1 text-xl font-extrabold text-[#151A3A] dark:text-white">See the lesson at a glance</h2><div className="mt-4 grid gap-4">{visuals.map(resource => <figure key={resource.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-[#151A3A]"><img src={resource.file_url} alt={resource.title || 'Lesson visual summary'} loading="lazy" className="mx-auto w-full rounded-xl object-contain" /><figcaption className="px-2 pb-1 pt-3 text-sm text-slate-500">{resource.description || resource.title}</figcaption></figure>)}</div></section>;
}

function LessonLoadingShell() {
  return <div className="mx-auto max-w-6xl space-y-5" role="status" aria-live="polite"><div className="h-4 w-48 animate-pulse rounded bg-stone-200 dark:bg-slate-700" /><div className="rounded-3xl bg-[#151A3A] p-6 shadow-xl sm:p-8"><div className="h-4 w-40 animate-pulse rounded bg-white/20" /><div className="mt-4 h-9 max-w-2xl animate-pulse rounded bg-white/20" /><div className="mt-4 h-4 w-56 animate-pulse rounded bg-white/10" /></div><div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><div className="h-8 max-w-xl animate-pulse rounded bg-stone-100 dark:bg-[#151A3A]" /><div className="mt-5 space-y-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-5 animate-pulse rounded bg-stone-100 dark:bg-[#151A3A]" />)}</div></div></div>;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const courseRef = safeDecode(String(params?.courseId || ''));
  const rawLessonRef = String(params?.lessonId || '');
  const lessonRef = safeDecode(rawLessonRef);
  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [practiceNotice, setPracticeNotice] = useState('');
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [teaching, setTeaching] = useState(false);
  const [teacherText, setTeacherText] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('learn');
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState<CheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [attempted, setAttempted] = useState(0);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const studySessionRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let extrasTimer: number | undefined;
    (async () => {
      if (!courseRef || !lessonRef) return;
      const cached = readCachedLesson(courseRef, lessonRef);
      if (cached) {
        setCourse(cached.course); setLesson(cached.lesson); setLessons(cached.lessons || []); setLoading(false); setError('');
      } else {
        setLoading(true); setError('');
      }
      setPracticeNotice('');
      try {
        const s = getSupabase();
        let courseQuery = s.from('courses').select(COURSE_ROUTE_COLUMNS).eq('status', 'published').limit(1);
        courseQuery = isUuid(courseRef) ? courseQuery.eq('id', courseRef) : courseQuery.eq('slug', courseRef);
        const { data: courseRow, error: courseError } = await courseQuery.maybeSingle();
        if (courseError) throw courseError;
        if (!courseRow) throw new Error('Course not found');

        let lessonQuery = s.from('lessons').select(LESSON_ROUTE_COLUMNS).eq('course_id', courseRow.id).eq('is_published', true).limit(1);
        lessonQuery = isUuid(lessonRef) ? lessonQuery.eq('id', lessonRef) : lessonQuery.eq('slug', lessonRef);
        const [lessonResult, listResult] = await Promise.all([
          lessonQuery.maybeSingle(),
          s.from('lessons').select(LESSON_NAV_COLUMNS).eq('course_id', courseRow.id).eq('is_published', true).order('order_index', { ascending: true }),
        ]);
        if (lessonResult.error) throw lessonResult.error;
        if (listResult.error) throw listResult.error;
        if (!lessonResult.data) throw new Error('Lesson not found');

        const routeData = { course: courseRow, lesson: lessonResult.data, lessons: listResult.data || [] };
        if (!cancelled) {
          setCourse(courseRow); setLesson(lessonResult.data); setLessons(listResult.data || []);
          setQuestions([]); setResources([]); setFlashcards([]); setFlashcardIndex(0); setFlashcardFlipped(false); setQi(0); setSelected(null); setChecked(null); setScore(0); setAttempted(0);
          setLoading(false);
          writeCachedLesson(courseRef, lessonRef, routeData);
          extrasTimer = window.setTimeout(() => { void loadLessonExtras(s, lessonResult.data, courseRow, () => cancelled); }, 80);
        }
      } catch (err: any) {
        if (!cancelled && !cached) setError(err?.message || 'Unable to load lesson');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const loadLessonExtras = async (s: ReturnType<typeof getSupabase>, found: any, c: any, isCancelled: () => boolean) => {
      const tasks: Promise<void>[] = [];
      if (found.topic_id && c.class_id && c.subject_id) {
        tasks.push((async () => {
          const { data, error: qError } = await s.from('questions').select('id,question_text,options,difficulty,marks,question_image_url,source').eq('topic_id', found.topic_id).eq('class_id', c.class_id).eq('subject_id', c.subject_id).eq('is_active', true).neq('source', 'THE GUIDE Curriculum Practice').limit(20);
          if (qError) { if (!isCancelled()) setPracticeNotice('Lesson opened. Stored practice questions are temporarily unavailable.'); return; }
          if (!isCancelled()) setQuestions((data || []).map((row: any) => ({ ...row, generated: false })));
        })());
      }
      tasks.push((async () => {
        const { data } = await s.from('lesson_resources').select('id,lesson_id,title,description,resource_type,file_url,mime_type,is_downloadable').eq('lesson_id', found.id).order('created_at', { ascending: true });
        if (!isCancelled()) setResources(data || []);
      })());
      tasks.push((async () => {
        try { const cards = await fetchPrebuiltFlashcards({ lessonId: found.id, limit: 20 }); if (!isCancelled()) setFlashcards(cards); } catch { if (!isCancelled()) setFlashcards([]); }
      })());
      await Promise.allSettled(tasks);
    };

    return () => { cancelled = true; if (extrasTimer) window.clearTimeout(extrasTimer); };
  }, [courseRef, lessonRef]);

  useEffect(() => {
    if (!token || !lesson?.id || !course?.id) return;
    let disposed = false;
    const id = window.setTimeout(() => {
      void startStudySession({ courseId: course.id, lessonId: lesson.id, activityType: lesson.video_url ? 'watching' : 'reading', metadata: { source: 'lesson-page' } }, token)
        .then(({ session }) => { if (disposed) { void endStudySession(session.id, token).catch(() => undefined); return; } studySessionRef.current = session.id; })
        .catch(() => undefined);
    }, 1200);
    return () => {
      disposed = true;
      window.clearTimeout(id);
      const sessionId = studySessionRef.current;
      if (sessionId) { studySessionRef.current = null; void endStudySession(sessionId, token).catch(() => undefined); }
    };
  }, [token, lesson?.id, lesson?.video_url, course?.id]);

  const lessonIndex = useMemo(() => lessons.findIndex(l => l.id === lesson?.id), [lessons, lesson?.id]);
  const previous = lessons[lessonIndex - 1];
  const next = lessons[lessonIndex + 1];
  const currentQ = questions[qi];
  const opts = optionsOf(currentQ?.options);
  const correct = answerOf(checked?.correctAnswer ?? currentQ?.correct_answer);
  const notes = lesson?.written_content || lesson?.description || '';

  const prepareTeacherExplanation = async () => {
    if (!lesson || !token || teaching) return;
    setTeaching(true); setTeacherText('');
    try {
      const response = await sendAiTutorMessage({ message: `Explain this published lesson clearly for a Nigerian student. Title: ${lesson.title}. Course: ${course?.title || 'Unknown'}. Notes: ${lesson.written_content || lesson.description || 'none'}. Objectives: ${asArray(lesson.learning_objectives).join('; ') || 'none'}. Include definitions, steps, examples, common mistakes and a short recap.`, context: { lessonId: lesson.id, courseId: lesson.course_id, lessonTitle: lesson.title } }, token);
      setTeacherText(response.message?.content || '');
    } catch { setTeacherText(''); } finally { setTeaching(false); }
  };

  const generatePractice = async () => {
    if (!lesson || !token || practiceLoading) return;
    setPracticeLoading(true); setError('');
    try {
      const s = getSupabase();
      const { data, error: practiceError } = await s.functions.invoke('lesson-practice', { body: { action: 'generate', lessonId: lesson.id, count: 8, allowAi: false } });
      if (practiceError) throw practiceError;
      const rows = Array.isArray(data?.quiz?.questions) ? data.quiz.questions : [];
      if (!rows.length) throw new Error('No lesson practice questions were returned');
      setQuestions(rows.map((row: any, index: number) => ({ id: String(row.id || `lesson-practice-${index + 1}`), question_text: String(row.questionText || ''), options: row.options || [], difficulty: row.difficulty || 'medium', generated: true, serverPractice: true, practiceIndex: Number.isInteger(row.index) ? row.index : index })));
      setQi(0); setSelected(null); setChecked(null); setScore(0); setAttempted(0); setActiveTab('practice'); setPracticeNotice('This practice set was prepared in advance from the published lesson and is ready immediately.');
    } catch (err: any) { setError(err?.message || 'Unable to load lesson practice'); } finally { setPracticeLoading(false); }
  };

  const selectAnswer = async (id: string) => {
    if (selected || !currentQ || checking) return;
    setSelected(id); setChecking(true); setError('');
    try {
      if (currentQ.serverPractice) {
        const s = getSupabase();
        const { data, error: practiceError } = await s.functions.invoke('lesson-practice', { body: { action: 'check', lessonId: lesson.id, count: questions.length || 5, questionIndex: currentQ.practiceIndex ?? qi, answerId: id } });
        if (practiceError) throw practiceError;
        const result = data?.result;
        if (!result || typeof result.isCorrect !== 'boolean') throw new Error('Unable to grade this practice answer');
        setChecked(result); setScore(value => value + (result.isCorrect ? 1 : 0)); setAttempted(value => value + 1); return;
      }
      if (!token) throw new Error('Sign in to check your answer');
      const result = await fetchCachedJson<{ data: { result: CheckResult } }>(`${learnerApiConfig.baseUrl}/questions/${currentQ.id}/check`, { method: 'POST', headers: getLearnerApiHeaders(token), credentials: learnerApiConfig.credentials, body: JSON.stringify({ answer: id }) }, { ttlMs: 0, retries: 1 });
      setChecked(result.data.result); setScore(value => value + (result.data.result.isCorrect ? 1 : 0)); setAttempted(value => value + 1);
    } catch (err: any) { setSelected(null); setError(err?.message || 'Unable to check answer'); } finally { setChecking(false); }
  };

  const markComplete = async () => {
    if (!lesson || completed || completing || !token) return;
    setCompleting(true); setError('');
    try { const response = await fetch(`${learnerApiConfig.baseUrl}/lessons/${lesson.id}/complete`, { method: 'POST', headers: getLearnerApiHeaders(token), credentials: learnerApiConfig.credentials }); await handleApiResponse(response); setCompleted(true); } catch (err: any) { setError(err?.message || 'Unable to mark lesson complete'); } finally { setCompleting(false); }
  };

  const goTo = (target?: any) => { if (target) router.push(`/dashboard/lessons/${encodeURIComponent(course?.slug || course?.id)}/${encodeURIComponent(target.slug || target.id)}`); };

  if (loading && !lesson) return <LessonLoadingShell />;
  if (error && !lesson) return <div className="mx-auto max-w-2xl py-16 text-center"><h1 className="text-xl font-bold text-[#151A3A] dark:text-white">Unable to open lesson</h1><p className="mt-2 text-slate-500">{error}</p><Link href="/dashboard/lessons" className="mt-6 inline-flex rounded-xl bg-[#151A3A] px-5 py-2.5 font-semibold text-white">Back to lessons</Link></div>;
  if (!lesson || !course) return null;

  return <div className="mx-auto max-w-6xl space-y-6">
    <div className="flex items-center gap-2 text-sm text-slate-500"><Link href="/dashboard/lessons">Lessons</Link><ChevronRight className="h-4 w-4" /><Link href={`/dashboard/courses/${encodeURIComponent(course.slug || course.id)}`} className="truncate">{course.title}</Link><ChevronRight className="h-4 w-4" /><span className="truncate text-slate-900 dark:text-white">{lesson.title}</span></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {practiceNotice && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{practiceNotice}</div>}
    <header className="rounded-3xl bg-[#151A3A] p-6 text-white shadow-xl sm:p-8"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-300">{course.title}</p><h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{lesson.title}</h1><div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-300"><span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{lesson.estimated_minutes || 10} min</span><span>{lessonIndex >= 0 ? `Lesson ${lessonIndex + 1} of ${lessons.length}` : ''}</span>{loading && <span className="inline-flex items-center gap-2 text-xs"><Loader2 className="h-3 w-3 animate-spin" />Refreshing</span>}</div></header>

    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
      <nav className="flex overflow-x-auto border-b border-stone-200 dark:border-slate-700">{(['learn', 'flashcards', 'practice', 'video', 'resources'] as Tab[]).map(tab => <button key={tab} onClick={() => { setActiveTab(tab); if (tab === 'practice' && !questions.length && token && !practiceLoading) void generatePractice(); }} className={`min-w-[120px] flex-1 px-4 py-3 text-sm font-bold ${activeTab === tab ? 'border-b-2 border-[#151A3A] text-[#151A3A] dark:text-white' : 'text-slate-500'}`}>{tab === 'learn' ? 'Learn & Teach' : tab === 'flashcards' ? `Flashcards${flashcards.length ? ` (${flashcards.length})` : ''}` : tab === 'practice' ? `Practice${questions.length ? ` (${questions.length})` : ''}` : tab === 'video' ? 'Video' : 'Resources'}</button>)}</nav>

      {activeTab === 'learn' && <div className="grid gap-8 p-6 lg:grid-cols-[1fr_300px] sm:p-8"><main><section><h2 className="text-2xl font-extrabold text-[#151A3A] dark:text-white">What you will learn</h2><ul className="mt-4 space-y-3">{(asArray(lesson.learning_objectives).length ? asArray(lesson.learning_objectives) : [`Understand ${lesson.title}`, `Apply the ideas in ${lesson.title}`, 'Check your understanding']).map((item, index) => <li key={index} className="flex gap-3 text-slate-600 dark:text-slate-300"><CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />{item}</li>)}</ul></section><section className="mt-10"><h2 className="text-2xl font-extrabold text-[#151A3A] dark:text-white">Lesson</h2><div className="mt-5"><LessonContent content={notes} /></div></section><LessonVisualMap title={lesson.title} objectives={lesson.learning_objectives} keyPoints={lesson.key_points} /><LessonQuickReference objectives={lesson.learning_objectives} keyPoints={lesson.key_points} /><LessonResourceVisuals resources={resources} />{!!asArray(lesson.key_points).length && <section className="mt-10 rounded-2xl bg-stone-50 p-6 dark:bg-[#151A3A]"><h2 className="text-xl font-extrabold text-[#151A3A] dark:text-white">Key points</h2><ul className="mt-4 space-y-2 text-slate-700 dark:text-slate-200">{asArray(lesson.key_points).map((item, index) => <li key={index} className="flex gap-2"><span>•</span>{item}</li>)}</ul></section>}</main><aside className="h-fit rounded-2xl border border-stone-200 bg-stone-50 p-5 dark:border-slate-700 dark:bg-[#151A3A]"><div className="flex items-center gap-2 font-extrabold text-[#151A3A] dark:text-white"><Sparkles className="h-5 w-5" />THE GUIDE Teacher</div>{teaching ? <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Preparing an explanation…</div> : <div className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{teacherText || 'The lesson opens first. Tap the button when you want an extra teacher-style explanation.'}</div>}<button onClick={() => void prepareTeacherExplanation()} disabled={!token || teaching} className="mt-5 w-full rounded-xl border border-[#151A3A] px-4 py-2.5 text-sm font-bold text-[#151A3A] disabled:opacity-50 dark:border-slate-300 dark:text-white">Explain this lesson</button><button onClick={() => setActiveTab('practice')} className="mt-2 w-full rounded-xl bg-[#151A3A] px-4 py-2.5 text-sm font-bold text-white">Go to practice</button></aside></div>}

      {activeTab === 'flashcards' && <div className="p-6 sm:p-8">{flashcards.length ? <div className="mx-auto max-w-3xl"><div className="mb-4 flex items-center justify-between gap-4 text-sm text-slate-500"><span>Card {flashcardIndex + 1} of {flashcards.length}</span><span className="truncate">{flashcards[flashcardIndex]?.title || 'Prebuilt lesson flashcards'}</span></div><button type="button" onClick={() => setFlashcardFlipped(value => !value)} className="min-h-[280px] w-full rounded-2xl border-2 border-brand-200 bg-brand-50 p-8 text-center dark:border-brand-900 dark:bg-brand-950/30"><span className="mb-4 block text-xs font-bold uppercase tracking-wider text-brand-600">{flashcardFlipped ? 'Answer' : 'Question'}</span><p className="mx-auto max-w-3xl text-lg leading-8 text-slate-900 dark:text-white">{flashcardFlipped ? flashcards[flashcardIndex]?.back : flashcards[flashcardIndex]?.front}</p><span className="mt-5 block text-xs text-slate-400">Tap to {flashcardFlipped ? 'see question' : 'reveal answer'}</span></button><div className="mt-5 flex justify-between gap-3"><button onClick={() => { setFlashcardIndex(index => Math.max(0, index - 1)); setFlashcardFlipped(false); }} disabled={flashcardIndex === 0} className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-40"><ChevronLeft className="mr-1 inline h-4 w-4" />Previous</button><button onClick={() => { setFlashcardIndex(index => Math.min(flashcards.length - 1, index + 1)); setFlashcardFlipped(false); }} disabled={flashcardIndex === flashcards.length - 1} className="rounded-xl bg-[#151A3A] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Next<ChevronRight className="ml-1 inline h-4 w-4" /></button></div></div> : <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">Flashcards load after the lesson. None are available yet for this lesson.</div>}</div>}

      {activeTab === 'practice' && <div className="p-6 sm:p-8">{!questions.length ? <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-stone-300 p-10 text-center dark:border-slate-700"><h2 className="text-xl font-extrabold text-[#151A3A] dark:text-white">Practice this lesson</h2><p className="mt-2 text-sm leading-6 text-slate-500">Open the stored practice set when you are ready. Lesson reading is no longer blocked by practice loading.</p><button onClick={generatePractice} disabled={!token || practiceLoading} className="mt-5 rounded-xl bg-[#151A3A] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{practiceLoading ? 'Loading practice…' : 'Open practice set'}</button></div> : <div className="mx-auto max-w-3xl"><div className="mb-4 flex items-center justify-between text-sm text-slate-500"><span>Question {qi + 1} of {questions.length}</span><span className="font-semibold">Score {score}/{attempted}</span></div><div className="rounded-2xl bg-stone-50 p-5 dark:bg-[#151A3A]"><p className="font-semibold leading-7 text-slate-900 dark:text-white">{currentQ?.question_text}</p>{currentQ?.question_image_url && <img src={currentQ.question_image_url} alt="Question" className="mt-4 max-h-72 rounded-xl object-contain" />}</div><div className="mt-4 space-y-2">{opts.map(option => <button key={option.id} disabled={!!selected || checking} onClick={() => void selectAnswer(option.id)} className={`w-full rounded-xl border px-4 py-3 text-left ${selected ? (option.id === correct ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : option.id === selected ? 'border-red-300 bg-red-50 text-red-800' : 'border-stone-200 bg-stone-50 text-slate-500') : 'border-stone-200 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-[#151A3A]'}`}><b className="mr-2">{option.id}.</b>{option.text}</button>)}</div>{checked?.explanation && <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm dark:border-brand-900 dark:bg-brand-950/30"><b>Explanation</b><p className="mt-1">{checked.explanation}</p></div>}<div className="mt-5 flex justify-between"><button onClick={() => { setQi(index => Math.max(index - 1, 0)); setSelected(null); setChecked(null); }} disabled={qi === 0} className="rounded-xl border px-4 py-2 disabled:opacity-40">Previous</button><button onClick={() => { setQi(index => Math.min(index + 1, questions.length - 1)); setSelected(null); setChecked(null); }} disabled={qi === questions.length - 1} className="rounded-xl bg-[#151A3A] px-4 py-2 font-semibold text-white disabled:opacity-40">Next</button></div></div>}</div>}

      {activeTab === 'video' && <div className="p-6 sm:p-8">{lesson.video_url ? <video ref={videoRef} controls src={lesson.video_url} className="aspect-video w-full rounded-2xl bg-black" /> : <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">No video is available for this lesson.</div>}</div>}
      {activeTab === 'resources' && <div className="p-6 sm:p-8">{resources.length ? <div className="grid gap-4">{resources.map((resource: any) => { const isImage = resource.resource_type === 'visual-summary' || String(resource.mime_type || '').startsWith('image/'); return <article key={resource.id} className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-slate-700 dark:bg-[#151A3A]">{isImage && <img src={resource.file_url} alt={resource.title || 'Lesson visual'} loading="lazy" className="w-full border-b border-stone-200 object-contain dark:border-slate-700" />}<div className="flex items-center justify-between gap-4 p-4"><span><b className="block">{resource.title}</b><span className="text-sm text-slate-500">{resource.description || resource.resource_type}</span></span><a href={resource.file_url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><Download className="h-4 w-4" />Open</a></div></article>; })}</div> : <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">Resources load after the lesson. None are attached yet.</div>}</div>}
    </div>

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><button onClick={() => goTo(previous)} disabled={!previous} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold disabled:opacity-40"><ChevronLeft className="h-4 w-4" />Previous lesson</button><button onClick={() => void markComplete()} disabled={completed || completing || !token} className={`rounded-xl px-5 py-3 font-semibold text-white ${completed ? 'bg-emerald-600' : 'bg-[#151A3A]'} disabled:opacity-60`}>{completed ? 'Completed' : completing ? 'Saving…' : 'Mark complete'}</button><button onClick={() => goTo(next)} disabled={!next} className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold disabled:opacity-40">Next lesson<ChevronRight className="h-4 w-4" /></button></div>
  </div>;
}
