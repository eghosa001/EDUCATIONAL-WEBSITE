'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Award,
  BookOpen,
  Clock3,
  Flame,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchMyCourses } from '@/services/api/courseService';
import {
  fetchLearningInsights,
  fetchStudentOverview,
  type LearningInsights,
} from '@/services/api/progressService';

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail?: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  completedAt?: string;
}

const EMPTY_INSIGHTS: LearningInsights = {
  practiceAttempts: 0,
  practiceCorrect: 0,
  practiceAccuracy: 0,
  currentStreak: 0,
  longestStreak: 0,
  strongTopics: [],
  weakTopics: [],
  subjects: [],
  weeklyActivity: [],
  recentExamScores: [],
};

export default function ProgressPage() {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [totalExams, setTotalExams] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [completedLessons, setCompletedLessons] = useState(0);
  const [insights, setInsights] = useState<LearningInsights>(EMPTY_INSIGHTS);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [coursesRes, progressRes, insightRes] = await Promise.all([
          fetchMyCourses(token),
          fetchStudentOverview(token),
          fetchLearningInsights(token),
        ]);
        if (cancelled) return;

        const courseList: CourseProgress[] = (coursesRes.courses || []).map((course: any) => ({
          courseId: String(course.courseId || course.id),
          courseTitle: String(course.courseTitle || course.title || 'Course'),
          courseSlug: String(course.courseSlug || course.slug || course.courseId || course.id),
          courseThumbnail: course.courseThumbnail || course.thumbnailUrl,
          progressPercentage: Number(course.progressPercentage || 0),
          completedLessons: Number(course.completedLessons || 0),
          totalLessons: Number(course.totalLessons || 0),
          completedAt: course.completedAt || null,
        }));
        setCourses(courseList);
        setTotalStudyTime(Number(progressRes.overview?.totalStudyTimeSeconds || 0));
        setTotalExams(Number(progressRes.overview?.examsTaken || 0));
        setAverageScore(Number(progressRes.overview?.averageExamScore || 0));
        setCompletedLessons(Number(progressRes.overview?.completedLessons || 0));
        setInsights(insightRes);
      } catch (err: any) {
        if (!cancelled) {
          console.error('Failed to load progress:', err);
          setError(err?.message || 'Unable to load your learning progress');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const formatTime = (seconds: number) => {
    const safe = Math.max(0, Number(seconds || 0));
    const h = Math.floor(safe / 3600);
    const m = Math.floor((safe % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => b.progressPercentage - a.progressPercentage),
    [courses],
  );
  const completedCourses = courses.filter((course) => course.progressPercentage >= 100).length;
  const weeklyMax = Math.max(
    1,
    ...insights.weeklyActivity.map((day) => day.practice + day.lessons * 2 + day.exams * 3 + Math.ceil(day.studyMinutes / 10)),
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-gray-500 dark:text-slate-300">Building your progress picture...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Lessons completed', value: completedLessons, icon: BookOpen, hint: `${completedCourses} courses finished` },
    { label: 'Study time', value: formatTime(totalStudyTime), icon: Clock3, hint: 'Recorded from lesson sessions' },
    { label: 'Average exam score', value: `${averageScore.toFixed(0)}%`, icon: Award, hint: `${totalExams} completed exams` },
    { label: 'Practice accuracy', value: `${insights.practiceAccuracy}%`, icon: Target, hint: `${insights.practiceAttempts} lesson questions answered` },
    { label: 'Current streak', value: `${insights.currentStreak}d`, icon: Flame, hint: `Best: ${insights.longestStreak} days` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">My Progress</h1>
          <p className="mt-1 text-gray-500 dark:text-slate-300">See what you have learned, where you are improving, and what to practise next.</p>
        </div>
        <Link href="/dashboard/reports" className="rounded-lg border border-gray-300 bg-white dark:bg-[#1b2045] px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:bg-[#151A3A]">
          Full report
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1b2045] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-slate-100">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-slate-300">{stat.hint}</p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <stat.icon className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1b2045] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">Last 7 days</p>
              <h2 className="mt-1 font-semibold text-gray-900 dark:text-slate-100">Learning activity</h2>
            </div>
            <Activity className="h-5 w-5 text-blue-600" />
          </div>

          {insights.weeklyActivity.length ? (
            <>
              <div className="mt-6 grid h-44 grid-cols-7 items-end gap-2">
                {insights.weeklyActivity.map((day) => {
                  const activity = day.practice + day.lessons * 2 + day.exams * 3 + Math.ceil(day.studyMinutes / 10);
                  const height = activity ? Math.max(10, Math.round((activity / weeklyMax) * 100)) : 4;
                  return (
                    <div key={day.date} className="flex h-full flex-col justify-end gap-2">
                      <div className="relative flex flex-1 items-end rounded-xl bg-gray-50 dark:bg-[#151A3A] px-1">
                        <div
                          className="w-full rounded-lg bg-blue-600 transition-all"
                          style={{ height: `${height}%` }}
                          title={`${day.practice} practice answers, ${day.lessons} lessons, ${day.exams} exams, ${day.studyMinutes} study minutes`}
                        />
                      </div>
                      <p className="text-center text-xs font-medium text-gray-500 dark:text-slate-300">{day.label}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Practice', insights.weeklyActivity.reduce((sum, day) => sum + day.practice, 0)],
                  ['Lessons', insights.weeklyActivity.reduce((sum, day) => sum + day.lessons, 0)],
                  ['Exams', insights.weeklyActivity.reduce((sum, day) => sum + day.exams, 0)],
                  ['Study min', insights.weeklyActivity.reduce((sum, day) => sum + day.studyMinutes, 0)],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl bg-gray-50 dark:bg-[#151A3A] p-3 text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{value}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-300">{label}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-slate-300">Your activity will appear here as you learn.</div>
          )}
        </section>

        <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1b2045] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-400">Performance trend</p>
          <h2 className="mt-1 font-semibold text-gray-900 dark:text-slate-100">Recent exam scores</h2>
          {insights.recentExamScores.length ? (
            <div className="mt-5 space-y-3">
              {insights.recentExamScores.map((score, index) => (
                <div key={index}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-300">Exam {insights.recentExamScores.length - index}</span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{score}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-gray-50 dark:bg-[#151A3A] p-6 text-center text-sm text-gray-500 dark:text-slate-300">
              Complete an exam to start your score trend.
            </div>
          )}
          <Link href="/dashboard/exams" className="mt-5 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
            Practise with an exam →
          </Link>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-green-200 bg-green-50/50 dark:bg-emerald-950/20 p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-700" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Strong topics</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">Topics with at least three practice answers and 75%+ accuracy.</p>
          <div className="mt-4 space-y-3">
            {insights.strongTopics.length ? insights.strongTopics.map((topic) => (
              <div key={topic.topicId} className="rounded-xl border border-green-100 bg-white dark:bg-[#1b2045] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-slate-100">{topic.topicName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-300">{topic.subjectName} · {topic.attempts} answers</p>
                  </div>
                  <span className="font-bold text-green-700">{topic.accuracy}%</span>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-green-200 bg-white/70 p-6 text-center text-sm text-gray-500 dark:text-slate-300">
                Answer a few lesson-practice questions and your strongest topics will appear here.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-6">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-700" />
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Needs attention</h2>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">Topics below 60% accuracy after at least three practice answers.</p>
          <div className="mt-4 space-y-3">
            {insights.weakTopics.length ? insights.weakTopics.map((topic) => (
              <div key={topic.topicId} className="rounded-xl border border-amber-100 bg-white dark:bg-[#1b2045] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900 dark:text-slate-100">{topic.topicName}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-300">{topic.subjectName} · {topic.correct}/{topic.attempts} correct</p>
                    <Link href={`/dashboard/flashcards?topic=${encodeURIComponent(topic.topicId)}`}
                      className="mt-2 inline-flex min-h-10 items-center rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 underline-offset-2 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950"
                      aria-label={`Revise weak topic: ${topic.topicName}`}>Revise this topic →</Link>
                  </div>
                  <span className="font-bold text-amber-700">{topic.accuracy}%</span>
                </div>
              </div>
            )) : (
              <div className="rounded-xl border border-dashed border-amber-200 bg-white/70 p-6 text-center text-sm text-gray-500 dark:text-slate-300">
                No weak topic has enough evidence yet. Keep practising to build an accurate picture.
              </div>
            )}
          </div>
        </section>
      </div>

      {insights.subjects.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1b2045]">
          <div className="border-b border-gray-100 dark:border-slate-700 px-6 py-4">
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Subject performance</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">Practice accuracy and completed exam scores by subject.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-gray-50 dark:bg-[#151A3A] text-left text-xs uppercase tracking-wide text-gray-500 dark:text-slate-300">
                <tr>
                  <th className="px-6 py-3">Subject</th>
                  <th className="px-6 py-3">Practice</th>
                  <th className="px-6 py-3">Practice accuracy</th>
                  <th className="px-6 py-3">Exams</th>
                  <th className="px-6 py-3">Exam average</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {insights.subjects.map((subject) => (
                  <tr key={subject.subjectId}>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">{subject.subjectName}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{subject.practiceAttempts}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{subject.practiceAccuracy == null ? '—' : `${subject.practiceAccuracy}%`}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{subject.examsTaken}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{subject.averageExamScore == null ? '—' : `${subject.averageExamScore}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#1b2045] p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Course progress</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-300">Calculated from the lessons you have actually completed.</p>
          </div>
          <Link href="/dashboard/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-700">Browse courses</Link>
        </div>
        {sortedCourses.length === 0 ? (
          <div className="py-8 text-center">
            <BookOpen className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500 dark:text-slate-300">No courses enrolled yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCourses.map((course) => (
              <Link key={course.courseId} href={`/dashboard/courses/${course.courseSlug}`} className="block rounded-xl p-3 transition-colors hover:bg-gray-50 dark:bg-[#151A3A]">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="truncate font-medium text-gray-900 dark:text-slate-100">{course.courseTitle}</p>
                  <span className={`text-sm font-semibold ${course.progressPercentage >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {course.progressPercentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                  <div
                    className={`h-full rounded-full ${course.progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, course.progressPercentage)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-slate-400">{course.completedLessons}/{course.totalLessons} lessons</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
