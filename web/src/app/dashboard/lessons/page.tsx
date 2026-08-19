'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, PlayIcon, ClockIcon, CheckCircleIcon, FolderIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchCourseLessons, fetchMyCourses } from '@/services/api/courseService';

interface LessonItem {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  slug?: string;
  description?: string;
  isPublished: boolean;
  estimatedMinutes?: number;
  orderIndex: number;
}

interface CourseLesson {
  course: { id: string; title: string; slug: string };
  lessons: LessonItem[];
}

export default function LessonsPage() {
  const { token } = useAuthStore();
  const [courseLessons, setCourseLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      fetchMyCourses(token),
    ])
      .then(([coursesRes]) => {
        const courses = coursesRes.courses || [];
        const loaded: CourseLesson[] = [];
        const promises = courses.map(async (c: any) => {
          try {
            const lessonsRes = await fetchCourseLessons(c.id, token);
            loaded.push({
              course: { id: c.id, title: c.title, slug: c.slug },
              lessons: lessonsRes.lessons || [],
            });
          } catch {
            loaded.push({ course: { id: c.id, title: c.title, slug: c.slug }, lessons: [] });
          }
        });
        Promise.all(promises).then(() => {
          setCourseLessons(loaded);
          setLoading(false);
        });
      })
      .catch(() => setLoading(false));
  }, [token]);

  const filteredLessons = courseLessons
    .map(cl => ({
      ...cl,
      lessons: cl.lessons.filter(l =>
        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.courseTitle.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(cl => cl.lessons.length > 0);

  const totalLessons = courseLessons.reduce((sum, cl) => sum + cl.lessons.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lessons</h1>
          <p className="text-gray-500 mt-1">{totalLessons} lessons across {courseLessons.length} courses</p>
        </div>
      </div>

      {token && (
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search lessons or courses..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {searchQuery ? 'No lessons found' : 'No courses enrolled'}
          </h3>
          <p className="text-gray-500 text-sm">
            {searchQuery
              ? 'Try a different search term.'
              : 'Enroll in a course to access its lessons.'
            }
          </p>
          {!searchQuery && (
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Courses
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredLessons.map(({ course, lessons }) => (
            <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                <FolderIcon className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">{course.title}</h2>
                <span className="text-xs text-gray-400 ml-auto">{lessons.length} lessons</span>
              </div>
              <div className="divide-y divide-gray-50">
                {lessons.slice(0, 10).map((lesson, idx) => (
                  <Link
                    key={lesson.id}
                    href={`/dashboard/lessons/${course.slug || course.id}/${lesson.slug || lesson.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-blue-50 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <PlayIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lesson.title}</p>
                      <p className="text-xs text-gray-500">{lesson.description || 'No description'}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                      <ClockIcon className="w-3 h-3" />
                      {lesson.estimatedMinutes || '?'} min
                    </span>
                    {lesson.isPublished ? (
                      <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <span className="text-xs text-gray-400 flex-shrink-0">Draft</span>
                    )}
                  </Link>
                ))}
                {lessons.length > 10 && (
                  <div className="px-5 py-3 text-center border-t border-gray-100">
                    <span className="text-sm text-gray-400">
                      And {lessons.length - 10} more lessons
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
