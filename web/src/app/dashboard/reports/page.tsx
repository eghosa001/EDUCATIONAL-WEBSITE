'use client';

import { useEffect, useState } from 'react';
import {
  FileDown,
  Printer,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  ClipboardCheck,
  Flame,
} from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchStudentOverview } from '@/services/api/progressService';
import { fetchMyCourses } from '@/services/api/courseService';
import { fetchMyExamAttempts } from '@/services/api/examService';
import { fetchMyStreak } from '@/services/api/gamificationService';
import { exportCsv } from '@/utils/exportCsv';

interface Overview {
  enrolledCourses: number;
  completedLessons: number;
  totalStudyTimeSeconds: number;
  averageCourseProgress: number;
  examsTaken: number;
  averageExamScore: number;
}

export default function StudentReportsPage() {
  const { token, user } = useAuthStore();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [streak, setStreak] = useState<{ currentStreak: number; longestStreak: number }>({ currentStreak: 0, longestStreak: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [overviewRes, coursesRes, attemptsRes, streakRes] = await Promise.all([
          fetchStudentOverview(token),
          fetchMyCourses(token),
          fetchMyExamAttempts(1, 50, token),
          fetchMyStreak(token),
        ]);
        setOverview(overviewRes.overview || null);
        setCourses(coursesRes.courses || []);
        setAttempts((attemptsRes as any).attempts || attemptsRes.data || []);
        setStreak(streakRes.streak || { currentStreak: 0, longestStreak: 0 });
      } catch (err) {
        console.error('Failed to load reports:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleExport = () => {
    exportCsv(`progress-report-${new Date().toISOString().split('T')[0]}.csv`, [
      { metric: 'Student', value: `${user?.firstName} ${user?.lastName}` },
      { metric: 'Courses Enrolled', value: overview?.enrolledCourses ?? 0 },
      { metric: 'Lessons Completed', value: overview?.completedLessons ?? 0 },
      { metric: 'Exams Taken', value: overview?.examsTaken ?? 0 },
      { metric: 'Study Time', value: formatTime(overview?.totalStudyTimeSeconds ?? 0) },
      { metric: 'Average Exam Score', value: `${overview?.averageExamScore ?? 0}%` },
      { metric: 'Average Course Progress', value: `${overview?.averageCourseProgress ?? 0}%` },
      { metric: 'Current Streak', value: streak.currentStreak },
      { metric: 'Longest Streak', value: streak.longestStreak },
    ]);
    exportCsv('course-progress.csv', courses.map(c => ({
      course: c.title || c.courseTitle || '—',
      progress: `${c.progressPercentage ?? c.progress_percentage ?? 0}%`,
      completedLessons: c.completedLessons ?? c.completed_lessons ?? 0,
      totalLessons: c.totalLessons ?? c.total_lessons ?? 0,
      lastAccessed: formatDate(c.lastAccessedAt || c.last_accessed_at),
    })));
    exportCsv('exam-performance.csv', attempts.map(a => ({
      exam: a.examTitle || a.exam?.title || '—',
      date: formatDate(a.submittedAt || a.startedAt),
      score: a.score ?? a.percentage ?? '—',
      percentage: a.percentage != null ? `${a.percentage}%` : '—',
      result: a.isPassed ? 'Passed' : a.percentage != null ? 'Failed' : '—',
    })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading report...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Courses Enrolled', value: overview?.enrolledCourses ?? 0, icon: BookOpen, color: 'blue' },
    { label: 'Lessons Completed', value: overview?.completedLessons ?? 0, icon: Award, color: 'green' },
    { label: 'Exams Taken', value: overview?.examsTaken ?? 0, icon: ClipboardCheck, color: 'purple' },
    { label: 'Study Time', value: formatTime(overview?.totalStudyTimeSeconds ?? 0), icon: Clock, color: 'orange' },
    { label: 'Avg Exam Score', value: `${(overview?.averageExamScore ?? 0).toFixed(0)}%`, icon: TrendingUp, color: 'teal' },
    { label: 'Avg Course Progress', value: `${overview?.averageCourseProgress ?? 0}%`, icon: TrendingUp, color: 'indigo' },
    { label: 'Current Streak', value: `${streak.currentStreak}d`, icon: Flame, color: 'rose' },
    { label: 'Longest Streak', value: `${streak.longestStreak}d`, icon: Flame, color: 'amber' },
  ];

  const sortedCourses = [...courses].sort((a, b) => {
    const ap = a.progressPercentage ?? a.progress_percentage ?? 0;
    const bp = b.progressPercentage ?? b.progress_percentage ?? 0;
    return bp - ap;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-500 mt-1">A full summary of your learning progress and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <FileDown className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Course Progress</h2>
        {sortedCourses.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No courses enrolled yet.</p>
        ) : (
          <div className="space-y-4">
            {sortedCourses.map(course => {
              const progress = course.progressPercentage ?? course.progress_percentage ?? 0;
              const completed = course.completedLessons ?? course.completed_lessons ?? 0;
              const total = course.totalLessons ?? course.total_lessons ?? 0;
              return (
                <div key={course.id || course.courseId || course.course_id}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-gray-900 text-sm truncate">{course.title || course.courseTitle || 'Course'}</p>
                    <span className={`text-sm font-semibold ${progress >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  {total > 0 && <p className="text-xs text-gray-400 mt-1">{completed}/{total} lessons</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Exam performance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Exam Performance</h2>
        </div>
        {attempts.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No exams attempted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                {['Exam', 'Date', 'Score', 'Percentage', 'Result'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {attempts.slice(0, 20).map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900 text-sm">{a.examTitle || a.exam?.title || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{formatDate(a.submittedAt || a.startedAt)}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{a.score ?? '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-500">{a.percentage != null ? `${a.percentage}%` : '—'}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.isPassed ? 'bg-green-100 text-green-700' : a.percentage != null ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {a.isPassed ? 'Passed' : a.percentage != null ? 'Failed' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
