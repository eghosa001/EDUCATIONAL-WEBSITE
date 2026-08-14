'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpenIcon, PlayIcon, ClockIcon, CheckCircleIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchCourseByIdOrSlug, enrollInCourse } from '@/services/api/courseService';
import type { Course } from '@/types/models/course';

export default function CourseDetailPage() {
  const params = useParams();
  const { token } = useAuthStore();
  const courseId = params?.courseId as string;
  const [course, setCourse] = useState<Course & { sections: any[]; lessons: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseByIdOrSlug(courseId, token)
        .then((res) => setCourse(res.data?.course || null))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [courseId, token]);

  const handleEnroll = async () => {
    if (!token || !courseId) return;
    setEnrolling(true);
    try {
      await enrollInCourse(courseId, token);
      setEnrolled(true);
    } catch {
      alert('Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="space-y-6 animate-pulse"><div className="h-48 bg-gray-200 rounded-xl" /><div className="h-6 bg-gray-200 rounded w-1/3" /><div className="h-4 bg-gray-100 rounded w-2/3" /></div>;
  }

  if (!course) {
    return (
      <div className="text-center py-16">
        <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Course not found</h2>
        <Link href="/dashboard/courses" className="text-blue-600 hover:text-blue-700">Back to courses</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-3">{course.difficulty}</span>
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <p className="text-blue-100 mt-2 max-w-xl">{course.shortDescription}</p>
          </div>
          <button
            onClick={handleEnroll}
            disabled={enrolling || enrolled}
            className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
              enrolled ? 'bg-green-500 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'
            } disabled:opacity-50`}
          >
            {enrolled ? '✓ Enrolled' : enrolling ? 'Enrolling...' : `Enroll ${course.isFree ? 'Free' : `₦${Number(course.price).toLocaleString()}`}`}
          </button>
        </div>
        <div className="flex gap-6 mt-4 text-sm text-blue-100">
          <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {course.totalDurationHours || 0}h content</span>
          <span className="flex items-center gap-1"><BookOpenIcon className="w-4 h-4" /> {course.lessonCount || 0} lessons</span>
          <span className="flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> {course.enrollmentCount || 0} students</span>
        </div>
      </div>

      {/* Curriculum */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Curriculum</h2>
        {(!course.sections || course.sections.length === 0) ? (
          <p className="text-gray-500 text-sm">No sections yet.</p>
        ) : (
          <div className="space-y-3">
            {course.sections.map((section: any, i: number) => (
              <div key={section.id} className="border border-gray-100 rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                  <span className="font-medium text-gray-900">{section.title}</span>
                </div>
                {section.lessons && section.lessons.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {section.lessons.map((lesson: any) => (
                      <Link key={lesson.id} href={`/dashboard/lessons/${lesson.slug}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <PlayIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 flex-1">{lesson.title}</span>
                        <span className="text-xs text-gray-400">{lesson.estimatedMinutes} min</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lessons */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Lessons ({course.lessons?.length || 0})</h2>
        {(course.lessons || []).length === 0 ? (
          <p className="text-gray-500 text-sm">No lessons available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.lessons.map((lesson: any) => (
              <Link
                key={lesson.id}
                href={`/dashboard/lessons/${lesson.slug}`}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  lesson.isPublished ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50' : 'border-gray-100 opacity-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${lesson.isPublished ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {lesson.isPublished ? <PlayIcon className="w-4 h-4 text-blue-600" /> : <ClockIcon className="w-4 h-4 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                  <p className="text-xs text-gray-500">{lesson.estimatedMinutes} min</p>
                </div>
                {!lesson.isPublished && <span className="text-xs text-gray-400">Draft</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
