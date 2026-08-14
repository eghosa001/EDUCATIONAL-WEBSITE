'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchMyCourses } from '@/services/api/courseService';

interface CourseProgress {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail: string;
  progressPercentage: number;
  completedAt: string | null;
  lastAccessedAt: string;
  totalLessons: number;
  completedLessons: number;
}

export default function ProgressPage() {
  const { token } = useAuthStore();
  const [progress, setProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchMyCourses(token)
        .then((res) => setProgress(res.courses || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const stats = {
    totalCourses: progress.length,
    completed: progress.filter(p => p.progressPercentage >= 100).length,
    inProgress: progress.filter(p => p.progressPercentage > 0 && p.progressPercentage < 100).length,
    totalLessons: progress.reduce((sum, p) => sum + (p.completedLessons || 0), 0),
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled', value: stats.totalCourses, color: 'blue' },
          { label: 'In Progress', value: stats.inProgress, color: 'yellow' },
          { label: 'Completed', value: stats.completed, color: 'green' },
          { label: 'Lessons Done', value: stats.totalLessons, color: 'purple' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-2 bg-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : progress.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500">No courses enrolled yet. Go to Courses to get started!</p>
          <a href="/dashboard/courses" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Browse Courses</a>
        </div>
      ) : (
        <div className="space-y-3">
          {progress.map(item => (
            <a key={item.courseId} href={`/dashboard/courses/${item.courseId}`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                  {item.courseTitle?.[0] || 'C'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.courseTitle}</p>
                  <p className="text-sm text-gray-500">{item.completedLessons}/{item.totalLessons} lessons</p>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${item.progressPercentage}%` }} />
                  </div>
                </div>
                <span className={`text-sm font-semibold ${item.progressPercentage >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                  {item.progressPercentage}%
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
