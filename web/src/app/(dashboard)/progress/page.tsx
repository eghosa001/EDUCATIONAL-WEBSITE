'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Award, TrendingUp, Clock } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchMyCourses } from '@/services/api/courseService';
import { fetchStudentOverview } from '@/services/api/progressService';

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

export default function ProgressPage() {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const [coursesRes, progressRes, streakRes] = await Promise.all([
          fetchMyCourses(token),
          fetchStudentOverview(token),
          import('@/services/api/gamificationService').then(m => m.fetchMyStreak(token)),
        ]);

        const courseList: CourseProgress[] = (coursesRes.courses || []).map((c: any) => ({
          courseId: c.courseId || c.id,
          courseTitle: c.courseTitle || c.title,
          courseSlug: c.courseSlug || c.slug,
          courseThumbnail: c.courseThumbnail || c.thumbnailUrl,
          progressPercentage: c.progressPercentage || 0,
          completedLessons: c.completedLessons || 0,
          totalLessons: c.totalLessons || 0,
          completedAt: c.completedAt || null,
        }));
        setCourses(courseList);

        setTotalStudyTime(progressRes.overview?.totalStudyTimeSeconds || 0);
        setTotalQuizzes(progressRes.overview?.examsTaken || 0);
        setAverageScore(progressRes.overview?.averageExamScore || 0);
      } catch (err) {
        console.error('Failed to load progress:', err);
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
          <p className="text-gray-500">Loading progress...</p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const sortedCourses = [...courses].sort((a, b) => b.progressPercentage - a.progressPercentage);
  const completedCount = courses.filter(c => c.progressPercentage >= 100).length;
  const inProgressCount = courses.filter(c => c.progressPercentage > 0 && c.progressPercentage < 100).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
        <p className="text-gray-500 mt-1">Track your learning journey and achievements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
              <p className="text-xs text-gray-500">Enrolled</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatTime(totalStudyTime)}</p>
              <p className="text-xs text-gray-500">Study Time</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{averageScore.toFixed(0)}%</p>
              <p className="text-xs text-gray-500">Avg Score</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Course Progress</h2>
        {sortedCourses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No courses enrolled yet.</p>
            <a href="/dashboard/courses" className="inline-block mt-3 text-blue-600 text-sm font-medium hover:text-blue-700">
              Browse Courses
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCourses.map(course => (
              <a key={course.courseId} href={`/dashboard/courses/${course.courseSlug}`} className="block">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                    {course.courseTitle?.[0] || 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900 truncate">{course.courseTitle}</p>
                      <span className={`text-sm font-semibold ${course.progressPercentage >= 100 ? 'text-green-600' : 'text-blue-600'}`}>
                        {course.progressPercentage}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          course.progressPercentage >= 100 ? 'bg-green-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${course.progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {course.completedLessons}/{course.totalLessons} lessons
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Weekly activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Activity Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{inProgressCount}</p>
            <p className="text-sm text-gray-500">In Progress</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{totalQuizzes}</p>
            <p className="text-sm text-gray-500">Exams Taken</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-900">{formatTime(totalStudyTime)}</p>
            <p className="text-sm text-gray-500">Total Time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
