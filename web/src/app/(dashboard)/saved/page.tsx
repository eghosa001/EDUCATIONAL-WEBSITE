'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookmarkIcon, BookOpenIcon, StarIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchCourses } from '@/services/api/courseService';

interface SavedCourse {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string;
  teacherId?: string;
  rating?: number;
  isFree: boolean;
  price: number;
}

export default function SavedPage() {
  const { token } = useAuthStore();
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetchCourses({ page: 1, limit: 20, featured: true }, token)
      .then(res => setSavedCourses((res.data || []) as unknown as SavedCourse[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading saved items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
        <p className="text-gray-500 mt-1">Your bookmarked courses and resources</p>
      </div>

      {savedCourses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <BookmarkIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No saved items yet</p>
          <p className="text-sm mt-1">Courses you save will appear here</p>
          <Link href="/dashboard/courses" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedCourses.map(course => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.slug}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg mb-3 flex items-center justify-center">
                <BookOpenIcon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                {course.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.shortDescription}</p>
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
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
