'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchStudentOverview } from '@/services/api/progressService';
import { fetchMyCourses } from '@/services/api/courseService';

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
  courseThumbnail?: string;
  progressPercentage: number;
  completedAt?: string | null;
  lastAccessedAt: string;
  totalLessons?: number;
  completedLessons?: number;
}

const priorityActions = [
  {
    label: 'Start focused session',
    href: '/dashboard/exams',
    eyebrow: 'Choose exam body',
    description: 'Pick WAEC, NECO, NABTEB or class practice before selecting subjects and mode.',
  },
  {
    label: 'Continue last CBT',
    href: '/dashboard/past-questions/analytics',
    eyebrow: 'Return quickly',
    description: 'Resume from recent exam work and see what still needs correction.',
  },
  {
    label: 'Review wrong answers',
    href: '/dashboard/past-questions/analytics',
    eyebrow: 'Fix weak areas',
    description: 'Use corrections and explanations after each scored session.',
  },
  {
    label: 'Open flashcards',
    href: '/dashboard/flashcards',
    eyebrow: 'Fast revision',
    description: 'Revise prebuilt cards by subject without waiting for generation.',
  },
  {
    label: 'JAMB CBT centre',
    href: '/dashboard/jamb',
    eyebrow: 'UTME path',
    description: 'Keep JAMB past questions, verified practice and four-subject CBT separate.',
  },
];

const returnPlan = [
  { title: 'Daily practice', copy: 'Complete one small session instead of opening every feature at once.' },
  { title: 'Weak areas', copy: 'Use recent scores to decide the next subject, topic or flashcard set.' },
  { title: 'Saved revision', copy: 'Return to the learning mode that helped most: CBT, lessons or cards.' },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading } = useAuthStore();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [recentCourses, setRecentCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !token) {
      setLoading(false);
      router.replace('/login');
      return;
    }

    let cancelled = false;
    const loadData = async () => {
      try {
        const [overviewRes, coursesRes] = await Promise.all([
          fetchStudentOverview(token),
          fetchMyCourses(token),
        ]);
        if (cancelled) return;
        setOverview(overviewRes?.overview || null);
        setRecentCourses(Array.isArray(coursesRes?.courses) ? coursesRes.courses.slice(0, 3) : []);
      } catch (err) {
        if (!cancelled) console.error('Failed to load dashboard data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [token, isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated || !token) return null;

  const formatStudyTime = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const stats = [
    { label: 'Courses Enrolled', value: loading ? '—' : overview?.enrolledCourses ?? 0 },
    { label: 'Lessons Completed', value: loading ? '—' : overview?.completedLessons ?? 0 },
    { label: 'Exams Taken', value: loading ? '—' : overview?.examsTaken ?? 0 },
    { label: 'Study Time', value: loading ? '—' : formatStudyTime(overview?.totalStudyTimeSeconds ?? 0) },
  ];

  const averageCourseProgress = Math.max(0, Math.min(100, overview?.averageCourseProgress ?? 0));
  const averageExamScore = Math.max(0, Math.min(100, overview?.averageExamScore ?? 0));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-[#151A3A] p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand-300">Student command centre</p>
            <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Welcome back, {user?.firstName || 'Student'}.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Choose one clear next action: continue learning, start CBT, revise cards or review weak areas from your last scored session.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/exams" className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#151A3A] transition hover:bg-brand-50">Start focused session</Link>
              <Link href="/dashboard/jamb" className="inline-flex items-center justify-center rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">Open JAMB centre</Link>
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

      <section className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">What to do next</p>
              <h2 className="text-xl font-extrabold text-[#151A3A] dark:text-white">Priority learning actions</h2>
            </div>
            <Link href="/dashboard/progress" className="text-sm font-bold text-brand-700 hover:text-brand-800 dark:text-brand-300">View progress →</Link>
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
          <h2 className="mt-1 text-xl font-extrabold text-[#151A3A] dark:text-white">Keep tomorrow simple</h2>
          <div className="mt-4 space-y-3">
            {returnPlan.map((item) => (
              <div key={item.title} className="rounded-2xl bg-brand-50 p-4 dark:bg-[#151A3A]">
                <h3 className="font-bold text-[#151A3A] dark:text-white">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.copy}</p>
              </div>
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
        {loading ? (
          <div className="space-y-3 py-2">
            {[0, 1, 2].map((item) => <div key={item} className="h-16 animate-pulse rounded-lg bg-stone-100 dark:bg-slate-800" />)}
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
                  <span className={`text-sm font-bold ${progress >= 100 ? 'text-emerald-600' : 'text-brand-700 dark:text-brand-300'}`}>{progress}%</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {(averageExamScore > 0 || averageCourseProgress > 0) && (
        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5 dark:border-brand-900 dark:bg-brand-950/20">
            <p className="text-3xl font-extrabold text-[#151A3A] dark:text-white">{averageCourseProgress}%</p>
            <p className="mt-1 text-sm font-semibold text-brand-700 dark:text-brand-300">Average course progress</p>
          </div>
          {averageExamScore > 0 && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/20">
              <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300">{averageExamScore}%</p>
              <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">Average exam score</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
