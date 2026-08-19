'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchParentProfile, fetchParentChildren, fetchChildPerformance } from '@/services/api/parentService';
import type { Child, ChildPerformance } from '@/services/api/parentService';

export default function ParentDashboardPage() {
  const { token } = useAuthStore();
  const [children, setChildren] = useState<Array<Child & Partial<ChildPerformance>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [profileRes, childrenRes] = await Promise.all([
          fetchParentProfile(token),
          fetchParentChildren(token),
        ]);
        const childrenList: Array<Child & Partial<ChildPerformance>> = (childrenRes.children || []).map(c => ({
          ...c,
          studyTimeSeconds: 0,
          coursesEnrolled: 0,
          coursesCompleted: 0,
          averageExamScore: 0,
          currentStreak: 0,
        }));
        setChildren(childrenList);

        // Load performance for each child
        await Promise.all(childrenList.map(async (child) => {
          try {
            const perf = await fetchChildPerformance(child.userId, token);
            setChildren(prev => prev.map(c =>
              c.userId === child.userId ? { ...c, ...perf.performance } : c
            ));
          } catch {
            // Child may not have performance data yet
          }
        }));
      } catch (err) {
        console.error('Failed to load parent data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

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

  if (!token) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h2>
        <p className="text-gray-500">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const totalStudyTime = children.reduce((sum, c) => sum + (c.studyTimeSeconds || 0), 0);
  const totalCourses = children.reduce((sum, c) => sum + (c.coursesEnrolled || 0), 0);
  const avgScore = children.length > 0
    ? children.reduce((sum, c) => sum + (c.averageExamScore || 0), 0) / children.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitor your children's learning progress</p>
      </div>

      {/* Children overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No children linked</h3>
            <p className="text-gray-500 text-sm">Link your children to start tracking their progress.</p>
          </div>
        ) : (
          children.map(child => (
            <div key={child.userId} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-700 font-semibold text-sm">
                  {(child.firstName || 'C')[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{child.firstName} {child.lastName}</p>
                  <span className="text-xs text-gray-500">{child.relationship || 'Child'}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Study Time</span>
                  <span className="font-medium text-gray-900">{formatTime(child.studyTimeSeconds || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" /> Courses</span>
                  <span className="font-medium text-gray-900">{child.coursesEnrolled || 0} enrolled</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Completed</span>
                  <span className="font-medium text-gray-900">{child.coursesCompleted || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Avg Score</span>
                  <span className="font-medium text-gray-900">{(child.averageExamScore || 0).toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Streak</span>
                  <span className="font-medium text-orange-500">{child.currentStreak || 0} days</span>
                </div>
              </div>

              <Link
                href={`/dashboard/parent/${child.userId}`}
                className="mt-4 block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View detailed report
              </Link>
            </div>
          ))
        )}
      </div>

      {/* Overall stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Overall Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-2xl font-bold text-blue-700">{children.length}</p>
            <p className="text-sm text-blue-600 mt-1">Children</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-700">{formatTime(totalStudyTime)}</p>
            <p className="text-sm text-green-600 mt-1">Total Study Time</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-2xl font-bold text-purple-700">{totalCourses}</p>
            <p className="text-sm text-purple-600 mt-1">Courses Enrolled</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl">
            <p className="text-2xl font-bold text-orange-700">{avgScore ? avgScore.toFixed(0) + '%' : 'N/A'}</p>
            <p className="text-sm text-orange-600 mt-1">Average Score</p>
          </div>
        </div>
      </div>
    </div>
  );
}
