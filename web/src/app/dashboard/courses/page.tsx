'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, StarIcon, UsersIcon, ClockIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchCourses, type CourseFilters } from '@/services/api/courseService';
import type { Course } from '@/types/models/course';

export default function CoursesPage() {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CourseFilters>({ page: 1, limit: 12, status: 'published' });

  useEffect(() => {
    if (token) {
      fetchCourses(filters, token)
        .then((res) => setCourses(res.data || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
          <p className="text-gray-500 mt-1">Browse our complete course catalog</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {['All', 'Mathematics', 'English', 'Science', 'Biology', 'Physics'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilters(prev => ({ ...prev, subjectId: cat === 'All' ? undefined : cat }))}
            className="px-4 py-2 rounded-full text-sm font-medium border transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-full mb-1" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No courses yet</h3>
          <p className="text-gray-500 text-sm">Courses will appear here once they are published.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.slug}`}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                <BookOpenIcon className="w-12 h-12 text-blue-400" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.shortDescription}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  {course.teacherId && (
                    <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" /> Teacher</span>
                  )}
                  {course.estimatedDuration && (
                    <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {course.estimatedDuration}h</span>
                  )}
                  {course.difficulty && (
                    <span className="capitalize">{course.difficulty}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className={`text-sm font-semibold ${course.isFree ? 'text-green-600' : 'text-blue-600'}`}>
                    {course.isFree ? 'Free' : `₦${Number(course.price).toLocaleString()}`}
                  </span>
                  {course.rating && course.rating > 0 && (
                    <span className="flex items-center gap-1 text-yellow-500 text-sm">
                      <StarIcon className="w-4 h-4 fill-current" />
                      {course.rating.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
