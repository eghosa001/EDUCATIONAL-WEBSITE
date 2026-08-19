'use client';

import { useEffect, useState } from 'react';
import {
  FileDown,
  Printer,
  Users,
  BookOpen,
  FileText,
  ClipboardCheck,
  Star,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  fetchTeacherAnalytics,
  fetchTeacherCourses,
  fetchTeacherCourseStats,
  fetchTeacherEarningsSummary,
  fetchTeacherStudents,
} from '@/services/api/teacherService';
import { exportCsv } from '@/utils/exportCsv';

export default function TeacherReportPage() {
  const { token } = useAuthStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [courseStats, setCourseStats] = useState<Record<string, any>>({});
  const [earnings, setEarnings] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [analyticsRes, coursesRes, earningsRes, studentsRes] = await Promise.all([
          fetchTeacherAnalytics(token),
          fetchTeacherCourses(1, 100, token),
          fetchTeacherEarningsSummary(token),
          fetchTeacherStudents(1, 100, token),
        ]);

        const coursesList = (coursesRes as any).data?.courses || (coursesRes as any).courses || (coursesRes as any).data || [];
        setAnalytics(analyticsRes.analytics || null);
        setCourses(coursesList || []);
        setEarnings((earningsRes as any).data?.summary || (earningsRes as any).summary || null);
        setStudents((studentsRes as any).data?.students || (studentsRes as any).students || (studentsRes as any).data || []);

        const statsMap: Record<string, any> = {};
        await Promise.all(coursesList.map(async (course: any) => {
          try {
            const res = await fetchTeacherCourseStats(course.id, token);
            statsMap[course.id] = res.stats;
          } catch {
            statsMap[course.id] = null;
          }
        }));
        setCourseStats(statsMap);
      } catch (err) {
        console.error('Failed to load teacher report:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const formatNaira = (value: number) => `₦${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleExport = () => {
    exportCsv('teacher-analytics.csv', [
      { metric: 'Total Students', value: analytics?.totalStudents ?? 0 },
      { metric: 'Total Courses', value: analytics?.totalCourses ?? 0 },
      { metric: 'Total Lessons', value: analytics?.totalLessons ?? 0 },
      { metric: 'Total Exams', value: analytics?.totalExams ?? 0 },
      { metric: 'Average Course Rating', value: analytics?.averageCourseRating ?? 0 },
      { metric: 'Average Student Progress', value: `${analytics?.averageStudentProgress ?? 0}%` },
      { metric: 'Total Earnings', value: formatNaira(analytics?.totalEarnings ?? 0) },
      { metric: 'Pending Earnings', value: formatNaira(analytics?.pendingEarnings ?? 0) },
    ]);
    exportCsv('course-performance.csv', courses.map(c => ({
      course: c.title || '—',
      students: courseStats[c.id]?.enrollmentCount ?? c.enrollmentCount ?? 0,
      completed: courseStats[c.id]?.completedCount ?? 0,
      completionRate: `${courseStats[c.id]?.completionRate ?? 0}%`,
      avgProgress: `${courseStats[c.id]?.avgProgress ?? 0}%`,
    })));
    exportCsv('teacher-students.csv', students.map(s => ({
      name: `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim() || '—',
      email: s.email || '—',
      progress: `${s.progressPercentage ?? s.progress_percentage ?? 0}%`,
      lastActive: formatDate(s.lastActiveAt || s.last_active_at),
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
    { label: 'Students', value: analytics?.totalStudents ?? 0, icon: Users, color: 'blue' },
    { label: 'Courses', value: analytics?.totalCourses ?? 0, icon: BookOpen, color: 'green' },
    { label: 'Lessons', value: analytics?.totalLessons ?? 0, icon: FileText, color: 'purple' },
    { label: 'Exams', value: analytics?.totalExams ?? 0, icon: ClipboardCheck, color: 'orange' },
    { label: 'Avg Rating', value: analytics?.averageCourseRating ? Number(analytics.averageCourseRating).toFixed(1) : '0.0', icon: Star, color: 'amber' },
    { label: 'Avg Progress', value: `${analytics?.averageStudentProgress ?? 0}%`, icon: TrendingUp, color: 'indigo' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Analytics</h1>
          <p className="text-gray-500 mt-1">Course performance, students and earnings report</p>
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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

      {/* Earnings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="font-semibold text-gray-900">Earnings Summary</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: formatNaira(earnings?.total ?? analytics?.totalEarnings ?? 0), color: 'text-gray-900' },
            { label: 'This Month', value: formatNaira(earnings?.thisMonth ?? 0), color: 'text-blue-600' },
            { label: 'Paid', value: formatNaira(earnings?.paid ?? 0), color: 'text-green-600' },
            { label: 'Pending', value: formatNaira(earnings?.pending ?? analytics?.pendingEarnings ?? 0), color: 'text-orange-600' },
          ].map(e => (
            <div key={e.label} className="p-4 bg-gray-50 rounded-xl">
              <p className={`text-xl font-bold ${e.color}`}>{e.value}</p>
              <p className="text-sm text-gray-500 mt-1">{e.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Course performance */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Course Performance</h2>
        </div>
        {courses.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No courses yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                {['Course', 'Students', 'Completed', 'Completion Rate', 'Avg Progress'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {courses.map(course => {
                  const statsRow = courseStats[course.id];
                  return (
                    <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 text-sm max-w-xs truncate">{course.title || course.name}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{statsRow?.enrollmentCount ?? course.enrollmentCount ?? 0}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{statsRow?.completedCount ?? 0}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{statsRow?.completionRate ?? 0}%</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{statsRow?.avgProgress ?? 0}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Students */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Students</h2>
        </div>
        {students.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">No students enrolled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                {['Name', 'Email', 'Progress', 'Last Active'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {students.slice(0, 50).map(s => {
                  const name = `${s.firstName || s.first_name || ''} ${s.lastName || s.last_name || ''}`.trim();
                  return (
                    <tr key={s.id || s.userId || s.user_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 text-sm">{name || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{s.email || '—'}</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{s.progressPercentage ?? s.progress_percentage ?? 0}%</td>
                      <td className="px-6 py-3 text-sm text-gray-500">{formatDate(s.lastActiveAt || s.last_active_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
