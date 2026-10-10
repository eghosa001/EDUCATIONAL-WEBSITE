'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, BookOpenIcon, CheckCircle2, ChevronRight, ClockIcon, Loader2, PlayIcon } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { enrollInCourse } from '@/services/api/courseService';

const COURSE_COLUMNS = 'id,title,slug,short_description,full_description,subject_id,class_id,term_id,status,difficulty,is_free,total_duration_hours';
const LESSON_CARD_COLUMNS = 'id,course_id,topic_id,slug,title,description,estimated_minutes,is_published,order_index';
const TOPIC_COLUMNS = 'id,name,description,order_index';
const COURSE_CACHE_TTL_MS = 2 * 60 * 1000;

type CourseRow = Record<string, any>;
type LessonRow = Record<string, any>;
type TopicRow = Record<string, any>;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function readCachedCourse(courseRef: string) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(`the-guide:course-detail:${courseRef}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || Date.now() - Number(parsed.savedAt) > COURSE_CACHE_TTL_MS) return null;
    return parsed.data || null;
  } catch {
    return null;
  }
}

function writeCachedCourse(courseRef: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`the-guide:course-detail:${courseRef}`, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Cache is only a navigation speed optimization.
  }
}

async function loadCourseDetail(courseRef: string) {
  const supabase = getSupabase();
  let courseQuery = supabase.from('courses').select(COURSE_COLUMNS).eq('status', 'published').limit(1);
  courseQuery = isUuid(courseRef) ? courseQuery.eq('id', courseRef) : courseQuery.eq('slug', courseRef);
  const { data: course, error: courseError } = await courseQuery.maybeSingle();
  if (courseError) throw new Error(courseError.message);
  if (!course) throw new Error('Course not found');

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select(LESSON_CARD_COLUMNS)
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('order_index', { ascending: true });
  if (lessonsError) throw new Error(lessonsError.message);

  const topicIds = [...new Set((lessons || []).map((lesson: LessonRow) => lesson.topic_id).filter(Boolean))];
  let topics: TopicRow[] = [];
  if (topicIds.length) {
    const { data, error } = await supabase.from('topics').select(TOPIC_COLUMNS).in('id', topicIds);
    if (!error) topics = data || [];
  }

  return { course, lessons: lessons || [], topics };
}

function CourseDetailSkeleton() {
  return <div className="space-y-5" role="status" aria-live="polite">
    <div className="h-5 w-40 animate-pulse rounded bg-stone-200 dark:bg-slate-700" />
    <div className="rounded-3xl bg-[#151A3A] p-7 shadow-xl"><div className="h-5 w-28 animate-pulse rounded bg-white/20" /><div className="mt-4 h-9 max-w-xl animate-pulse rounded bg-white/20" /><div className="mt-3 h-4 max-w-2xl animate-pulse rounded bg-white/10" /></div>
    <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-700 dark:bg-[#1b2045]"><div className="h-6 w-44 animate-pulse rounded bg-stone-200 dark:bg-slate-700" /><div className="mt-5 space-y-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-stone-100 dark:bg-[#151A3A]" />)}</div></div>
  </div>;
}

export default function CourseDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const courseRef = String(params?.courseId || '');
  const [course, setCourse] = useState<CourseRow | null>(null);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [topics, setTopics] = useState<TopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!courseRef) return;
    let cancelled = false;
    const cached = readCachedCourse(courseRef);
    if (cached) {
      setCourse(cached.course);
      setLessons(cached.lessons || []);
      setTopics(cached.topics || []);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError('');

    void loadCourseDetail(courseRef)
      .then((data) => {
        if (cancelled) return;
        setCourse(data.course);
        setLessons(data.lessons);
        setTopics(data.topics);
        writeCachedCourse(courseRef, data);
        const firstTopics = [...new Set(data.lessons.map((lesson: LessonRow) => lesson.topic_id).filter(Boolean))] as string[];
        setOpenTopics(firstTopics.reduce((acc, id) => ({ ...acc, [id]: true }), {}));
      })
      .catch((err) => {
        if (!cancelled && !cached) setError(err instanceof Error ? err.message : 'Unable to load course');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [courseRef]);

  const topicGroups = useMemo(() => {
    const topicMap = new Map(topics.map((topic) => [topic.id, topic]));
    const groups = new Map<string, { topic: TopicRow | null; lessons: LessonRow[] }>();
    for (const lesson of lessons) {
      const key = lesson.topic_id || `unassigned-${lesson.id}`;
      if (!groups.has(key)) groups.set(key, { topic: topicMap.get(lesson.topic_id) || null, lessons: [] });
      groups.get(key)!.lessons.push(lesson);
    }
    return Array.from(groups.entries())
      .map(([key, group]) => ({ key, ...group }))
      .sort((a, b) => (a.topic?.order_index ?? 999) - (b.topic?.order_index ?? 999));
  }, [lessons, topics]);

  const handleEnroll = async () => {
    if (!token || !course?.id) return;
    setEnrolling(true);
    try {
      await enrollInCourse(course.id, token);
      setEnrolled(true);
    } catch (err: any) {
      if (String(err?.message || '').toLowerCase().includes('already enrolled')) setEnrolled(true);
      else setError(err?.message || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading && !course) return <CourseDetailSkeleton />;
  if (error && !course) return <div className="py-16 text-center"><BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-stone-300" /><h2 className="mb-2 text-xl font-semibold text-[#151A3A] dark:text-white">Course not found</h2><p className="mb-4 text-sm text-red-600">{error}</p><Link href="/dashboard/courses" className="font-semibold text-[#151A3A] dark:text-white">Back to courses</Link></div>;
  if (!course) return null;

  const courseRoute = course.slug || course.id;
  const lessonHref = (lesson: LessonRow) => `/dashboard/lessons/${encodeURIComponent(courseRoute)}/${encodeURIComponent(lesson.slug || lesson.id)}`;

  return <div className="min-w-0 space-y-6">
    <Link href="/dashboard/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeftIcon className="h-4 w-4" />Back to courses</Link>
    {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}
    <div className="min-w-0 rounded-3xl bg-[#151A3A] p-5 text-white shadow-xl sm:p-7">
      <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0"><span className="inline-block rounded-full bg-white/10 px-3 py-1 text-sm font-medium">{course.difficulty || 'Core course'}</span><h1 className="mt-3 break-words text-2xl font-extrabold sm:text-3xl">{course.title}</h1><p className="mt-2 max-w-2xl break-words text-slate-300">{course.short_description || course.full_description || 'Learn this subject through structured teaching, examples and practice.'}</p></div>
        <button onClick={handleEnroll} disabled={enrolling || enrolled || !token} className={`min-h-11 w-full shrink-0 rounded-xl px-6 py-3 font-semibold sm:w-auto ${enrolled ? 'bg-emerald-500 text-white' : 'bg-white text-[#151A3A]'} disabled:opacity-50`}>{enrolled ? '✓ Enrolled' : enrolling ? 'Enrolling...' : course.is_free ? 'Start free' : 'Enroll'}</button>
      </div>
      <div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-300"><span className="flex items-center gap-1"><ClockIcon className="h-4 w-4" />{course.total_duration_hours || 0}h content</span><span className="flex items-center gap-1"><BookOpenIcon className="h-4 w-4" />{lessons.length} lessons</span>{loading && <span className="inline-flex items-center gap-2 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" />Refreshing</span>}</div>
    </div>

    <div className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-6"><h2 className="mb-2 text-xl font-extrabold text-[#151A3A] dark:text-white">Topics & Lessons</h2><p className="mb-5 text-sm text-slate-500">Only lesson metadata is loaded here, so this page opens quickly. Full lesson bodies load only when a lesson is opened.</p>{!lessons.length ? <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-slate-500">No published lessons are attached to this course.</div> : topicGroups.map((group, index) => {
      const topicKey = group.topic?.id || group.key;
      const isOpen = openTopics[topicKey] ?? true;
      return <section key={group.key} className="mb-4 overflow-hidden rounded-xl border border-stone-200 dark:border-slate-700"><button onClick={() => setOpenTopics(value => ({ ...value, [topicKey]: !isOpen }))} className="flex w-full items-center gap-3 bg-stone-50 px-4 py-3 text-left dark:bg-[#151A3A]"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#151A3A] text-xs font-bold text-white">{index + 1}</span><div className="min-w-0 flex-1"><div className="break-words font-bold text-[#151A3A] dark:text-white">{group.topic?.name || group.topic?.title || 'Lessons'}</div>{group.topic?.description && <div className="truncate text-xs text-slate-500">{group.topic.description}</div>}</div>{isOpen ? <ChevronRight className="h-5 w-5 rotate-90 text-slate-400" /> : <ChevronRight className="h-5 w-5 text-slate-400" />}</button>{isOpen && <div className="divide-y divide-stone-100 dark:divide-slate-700">{group.lessons.sort((a, b) => (a.order_index ?? 999) - (b.order_index ?? 999)).map((lesson) => <Link key={lesson.id} href={lessonHref(lesson)} prefetch className="flex items-center gap-3 px-4 py-4 transition hover:bg-stone-50 dark:hover:bg-[#151A3A]"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500/70" /><span className="min-w-0 flex-1 break-words text-sm font-medium text-slate-700 dark:text-slate-200">{lesson.title}</span><span className="shrink-0 whitespace-nowrap text-xs text-slate-400">{lesson.estimated_minutes || 10} min</span><PlayIcon className="h-4 w-4 shrink-0 text-[#151A3A] dark:text-slate-300" /><ChevronRight className="h-4 w-4 text-slate-300" /></Link>)}</div>}</section>;
    })}</div>
  </div>;
}
