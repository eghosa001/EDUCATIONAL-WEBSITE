'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, TrendingUp, WalletIcon, ClipboardCheckIcon, UsersIcon, AwardIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import {
  fetchTeacherAnalytics,
  fetchTeacherCourses,
  fetchTeacherEarningsSummary,
  type TeacherAnalytics,
  type TeacherProfile,
} from '@/services/api/teacherService';

interface TeacherCourse {
  id: string;
  title: string;
  studentCount: number;
  averageProgress: number;
}

interface EarningSummary {
  totalEarnings: number;
  pendingEarnings: number;
  last30Days: number;
}

export default function TeacherPage() {
  const { token, user } = useAuthStore();
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [earnings, setEarnings] = useState<EarningSummary | null>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== 'teacher') return;
    setLoading(true);
    Promise.all([
      fetchTeacherAnalytics(token),
      fetchTeacherEarningsSummary(token),
      fetchTeacherCourses(1, 6, token),
    ])
      .then(([analyticsRes, earningsRes, coursesRes]) => {
        setAnalytics(analyticsRes.analytics || null);
        setEarnings(earningsRes.summary || null);
        setCourses((coursesRes.data || []).slice(0, 6));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'My Courses', value: analytics?.totalCourses ?? 0, icon: BookOpenIcon, color: 'blue' },
    { label: 'Active Students', value: analytics?.totalStudents ?? 0, icon: UsersIcon, color: 'green' },
    { label: 'Total Earnings', value: `₦${(earnings?.totalEarnings ?? 0).toLocaleString()}`, icon: WalletIcon, color: 'purple' },
    { label: 'Avg. Progress', value: `${Math.round(analytics?.averageStudentProgress ?? 0)}%`, icon: TrendingUp, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your courses and students</p>
        </div>
        {earnings?.pendingEarnings ? (
          <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
            ₦{earnings.pendingEarnings.toLocaleString()} pending payout
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">My Courses</h2>
            <Link href="/dashboard/courses" className="text-sm text-blue-600 hover:text-blue-700">View all</Link>
          </div>
          {courses.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No courses yet. Create your first course!
            </div>
          ) : (
            <div className="space-y-3">
              {courses.map(course => (
                <div key={course.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                    {course.title[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{course.title}</p>
                    <p className="text-xs text-gray-500">{course.studentCount} students</p>
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${course.averageProgress}%` }} />
                    </div>
                  </div>
                  <Link href={`/dashboard/courses/${course.id}`} className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">Manage</Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Earnings Summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Earnings</h2>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">
                ₦{(earnings?.last30Days ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-600 mt-1">Last 30 days</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">
                ₦{(earnings?.totalEarnings ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-blue-600 mt-1">Total earned</p>
            </div>
            {earnings?.pendingEarnings ? (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-700">
                  ₦{earnings.pendingEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-yellow-600 mt-1">Pending payout</p>
              </div>
            ) : null}
          </div>
          <Link
            href="/dashboard/teacher/report"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AwardIcon className="w-4 h-4" /> View Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
