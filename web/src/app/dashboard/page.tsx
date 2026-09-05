'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchStudentOverview } from '@/services/api/progressService';
import { fetchMyCourses } from '@/services/api/courseService';
import { useRouter } from 'next/navigation';

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

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !token) return null;

  const formatStudyTime = (seconds: number) => {
    const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? seconds : 0;
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const stats = [
    { label: 'Courses Enrolled', value: overview?.enrolledCourses ?? 0 },
    { label: 'Lessons Completed', value: overview?.completedLessons ?? 0 },
    { label: 'Exams Taken', value: overview?.examsTaken ?? 0 },
    { label: 'Study Time', value: formatStudyTime(overview?.totalStudyTimeSeconds ?? 0) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.firstName || 'Student'}!</h1>
        <p className="text-gray-500 mt-1">Continue your learning journey</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Browse Courses', href: '/dashboard/courses', icon: '📚' },
            { label: 'Take Quiz', href: '/dashboard/exams', icon: '📝' },
            { label: 'AI Tutor', href: '/dashboard/ai/tutor', icon: '🤖' },
            { label: 'Flashcards', href: '/dashboard/flashcards', icon: '🃏' },
          ].map((action) => (
            <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
              <span className="text-2xl">{action.icon}</span>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Continue Learning</h2>
          <Link href="/dashboard/courses" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
        </div>
        {recentCourses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No courses enrolled yet.</p>
            <Link href="/dashboard/courses" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">Browse Courses</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCourses.map((course) => {
              const progress = Math.max(0, Math.min(100, Number(course.progressPercentage) || 0));
              return (
                <Link key={course.courseId || course.id} href={`/dashboard/courses/${course.courseId || course.id}`} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-600 font-bold text-sm">{course.courseTitle?.[0] || 'C'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{course.courseTitle || 'Untitled course'}</p>
                    <p className="text-xs text-gray-500">{course.completedLessons ?? 0}/{course.totalLessons ?? 0} lessons</p>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
                  </div>
                  <span className={`text-sm font-semibold ${progress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>{progress}%</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {overview && (overview.averageExamScore > 0 || overview.averageCourseProgress > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Performance Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg"><p className="text-2xl font-bold text-blue-700">{overview.averageCourseProgress}%</p><p className="text-sm text-blue-600 mt-1">Avg Course Progress</p></div>
            {overview.averageExamScore > 0 && <div className="p-4 bg-green-50 rounded-lg"><p className="text-2xl font-bold text-green-700">{overview.averageExamScore}%</p><p className="text-sm text-green-600 mt-1">Avg Exam Score</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}
