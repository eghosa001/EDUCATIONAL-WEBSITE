'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchStudentOverview, fetchStudentFocus, type StudentFocus } from '@/services/api/progressService';
import { fetchRecentCourses } from '@/services/api/courseService';
import { chooseStudyRecommendation } from '@/lib/studyRecommendation';

interface OverviewData {
  enrolledCourses: number;
  completedLessons: number;
  totalStudyTimeSeconds: number;
  averageCourseProgress: number;
  examsTaken: number;
  averageExamScore: number;
}

interface CourseItem {
  id: string;
  courseId: string;
  courseTitle: string;
  progressPercentage: number;
  completedAt?: string | null;
  lastAccessedAt: string;
  totalLessons?: number;
  completedLessons?: number;
}

const priorityActions = [
  { label: 'Start focused session', href: '/dashboard/exams', eyebrow: 'Choose exam body', description: 'Pick WAEC, NECO, NABTEB or class practice before selecting subjects and mode.' },
  { label: 'Review recent CBT', href: '/dashboard/past-questions/analytics', eyebrow: 'Understand mistakes', description: 'Inspect past results and choose what to correct next. To resume a study course, use Continue Learning below.' },
  { label: 'Review wrong answers', href: '/dashboard/past-questions/analytics', eyebrow: 'Fix weak areas', description: 'Use corrections and explanations after each scored session.' },
  { label: 'Open flashcards', href: '/dashboard/flashcards', eyebrow: 'Fast revision', description: 'Revise prebuilt cards by subject without waiting for generation.' },
];

const retentionCards = [
  { title: 'Daily practice', copy: 'Complete one small session instead of opening every feature at once.', href: '/dashboard/exams' },
  { title: 'Weak-topic review', copy: 'Use your recent lesson practice results to focus on topics that need attention.', href: '/dashboard/progress' },
  { title: 'Recently viewed', copy: 'Return to enrolled courses and pick up from the next lesson.', href: '/dashboard/courses' },
  { title: 'Saved questions', copy: 'Keep difficult questions together so revision is not scattered.', href: '/dashboard/library' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading } = useAuthStore();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [recentCourses, setRecentCourses] = useState<CourseItem[]>([]);
  const [focus, setFocus] = useState<StudentFocus | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [focusLoading, setFocusLoading] = useState(true);
  const [overviewError, setOverviewError] = useState('');
  const [coursesError, setCoursesError] = useState('');
  const [focusError, setFocusError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !token) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    // Independent requests: slow statistics must never block recent courses,
    // and a failed optional recommendation must not blank the whole dashboard.
    setOverviewLoading(true);
    setCoursesLoading(true);
    setFocusLoading(true);
    setOverviewError('');
    setCoursesError('');
    setFocusError('');
    void fetchStudentOverview(token)
      .then(result => { if (!cancelled) setOverview(result.overview); })
      .catch(() => {
        if (!cancelled) { setOverview(null); setOverviewError('Study statistics are temporarily unavailable.'); }
      })
      .finally(() => { if (!cancelled) setOverviewLoading(false); });
    void fetchRecentCourses(token, 3)
      .then(result => { if (!cancelled) setRecentCourses(result.courses || []); })
      .catch(() => {
        if (!cancelled) { setRecentCourses([]); setCoursesError('Recent courses could not be loaded.'); }
      })
      .finally(() => { if (!cancelled) setCoursesLoading(false); });
    void fetchStudentFocus(token)
      .then(result => { if (!cancelled) setFocus(result); })
      .catch(() => {
        if (!cancelled) { setFocus(null); setFocusError('Personalised study suggestions are temporarily unavailable.'); }
      })
      .finally(() => { if (!cancelled) setFocusLoading(false); });
    return () => { cancelled = true; };
  }, [token, isAuthenticated, isLoading, router, reloadKey]);

  if (isLoading || !isAuthenticated || !token) return null;

  const formatStudyTime = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const stats = [
    { label: 'Courses Enrolled', value: overviewLoading || !overview ? '—' : overview.enrolledCourses },
    { label: 'Lessons Completed', value: overviewLoading || !overview ? '—' : overview.completedLessons },
    { label: 'Exams Taken', value: overviewLoading || !overview ? '—' : overview.examsTaken },
    { label: 'Study Time', value: overviewLoading || !overview ? '—' : formatStudyTime(overview.totalStudyTimeSeconds) },
  ];
  const recommendation = chooseStudyRecommendation(focus, recentCourses);
  const recommendationLoading = focusLoading || coursesLoading;
  const hadError = Boolean(overviewError || coursesError || focusError || focus?.partialFailure);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-[#151A3A] p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-300">Student command centre</p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Welcome back, {user?.firstName || 'Student'}.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Your Next best step is based on your recent lessons, due flashcards and practice results—not a generic ranking.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/jamb" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#151A3A] transition hover:bg-brand-50">Open JAMB centre</Link>
              <Link href="/dashboard/flashcards" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Open flashcards</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-4 lg:grid-cols-2">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-white/10 p-4">
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {hadError && (
        <section role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <span>{overviewError || coursesError || focusError || 'Some study recommendations could not be fully checked.'} Your saved progress has not been reset.</span>
          <button type="button" onClick={() => setReloadKey(key => key + 1)} className="rounded-lg border border-amber-500 px-4 py-2 font-semibold hover:bg-amber-100 dark:hover:bg-amber-950">Retry loading</button>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">What to do next</p>
              <h2 className="text-xl font-extrabold text-[#151A3A] dark:text-white">Priority learning actions</h2>
            </div>
            <Link href="/dashboard/progress" className="text-sm font-bold text-brand-700 hover:text-brand-800 dark:text-brand-300">View progress →</Link>
          </div>
          <div className="mb-5 rounded-2xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-900 dark:bg-[#151A3A]" aria-live="polite">
            {recommendationLoading ? (
              <div role="status" className="space-y-3">
                <div className="h-4 w-40 animate-pulse rounded bg-brand-100 dark:bg-slate-700"/>
                <div className="h-6 w-2/3 animate-pulse rounded bg-brand-100 dark:bg-slate-700"/>
                <p className="text-sm text-slate-600 dark:text-slate-300">Finding your next useful study step…</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">{recommendation.eyebrow}</p>
                <h3 className="mt-2 text-lg font-extrabold text-[#151A3A] dark:text-white">{recommendation.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{recommendation.explanation}</p>
                <Link href={recommendation.href} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#151A3A] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#202750] focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:bg-brand-700">{recommendation.action} →</Link>
              </>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {priorityActions.map((action) => (
              <Link key={action.label} href={action.href} className="rounded-2xl border border-stone-200 bg-stone-50 p-4 transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white hover:shadow-brand-sm dark:border-slate-700 dark:bg-[#151A3A] dark:hover:bg-[#202750]">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">{action.eyebrow}</p>
                <h3 className="mt-2 font-extrabold text-[#151A3A] dark:text-white">{action.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{action.description}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">Return plan</p>
          <h2 className="mt-1 text-xl font-extrabold text-[#151A3A] dark:text-white">Make tomorrow easier</h2>
          <div className="mt-4 space-y-3">
            {retentionCards.map((item) => (
              <Link key={item.title} href={item.href} className="block rounded-2xl bg-brand-50 p-4 transition hover:bg-brand-100 dark:bg-[#151A3A] dark:hover:bg-[#202750]">
                <h3 className="font-bold text-[#151A3A] dark:text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.copy}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-[#151A3A] dark:text-white">Continue Learning</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Resume recent courses without making the dashboard too long.</p>
          </div>
          <Link href="/dashboard/courses" className="text-sm font-bold text-brand-700 hover:text-brand-800 dark:text-brand-300">View all</Link>
        </div>
        {coursesLoading ? (
          <div className="space-y-3 py-2">{[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-stone-100 dark:bg-slate-800" />)}</div>
        ) : coursesError ? (
          <div role="status" className="rounded-2xl border border-dashed border-amber-300 p-8 text-center dark:border-amber-900">
            <p className="text-sm text-amber-800 dark:text-amber-200">Unable to show enrolled courses right now. Use Retry loading above.</p>
          </div>
        ) : recentCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center dark:border-slate-700">
            <p className="text-sm text-slate-500 dark:text-slate-400">No courses enrolled yet.</p>
            <Link href="/dashboard/courses" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#151A3A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#202750]">Browse Courses</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCourses.map((course) => {
              const progress = Math.max(0, Math.min(100, Number(course.progressPercentage) || 0));
              return (
                <Link key={course.courseId || course.id} href={`/dashboard/courses/${course.courseId || course.id}`} className="flex items-center gap-4 rounded-2xl border border-stone-100 p-4 transition hover:border-brand-200 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-[#202750]">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-200">{course.courseTitle?.[0] || 'C'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-[#151A3A] dark:text-white">{course.courseTitle || 'Untitled course'}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{course.completedLessons ?? 0}/{course.totalLessons ?? 0} lessons</p>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-slate-700"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{progress}%</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
