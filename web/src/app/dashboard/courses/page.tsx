'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, StarIcon, UsersIcon, ClockIcon, Search } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchCourses, type CourseFilters } from '@/services/api/courseService';
import type { Course } from '@/types/models/course';

export default function CoursesPage() {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<CourseFilters>({ page: 1, limit: 12, status: 'published' });

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    fetchCourses(filters, token).then((res) => setCourses(res.data || [])).catch(console.error).finally(() => setLoading(false));
  }, [token, filters]);

  const submitSearch = (e: React.FormEvent) => { e.preventDefault(); setFilters((prev) => ({ ...prev, page: 1, search: search.trim() || undefined })); };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Courses</h1><p className="text-gray-500 mt-1">Browse the THE GUIDE course catalog</p></div>
      <form onSubmit={submitSearch} className="flex gap-2 max-w-xl">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" /></div>
        <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Search</button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{[1,2,3,4,5,6].map(i => <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"><div className="h-40 bg-gray-200 rounded-lg mb-4" /><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-full" /></div>)}</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200"><BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-medium text-gray-900">No courses found</h3><p className="text-gray-500 text-sm mt-1">Try another search.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => <Link key={course.id} href={`/dashboard/courses/${course.slug}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">{course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <BookOpenIcon className="w-12 h-12 text-blue-400" />}</div>
            <div className="p-4"><h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1">{course.title}</h3><p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.shortDescription || course.description}</p>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">{course.teacherId && <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" /> Teacher</span>}{course.totalDurationHours ? <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {course.totalDurationHours}h</span> : null}{course.difficulty && <span className="capitalize">{course.difficulty}</span>}</div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100"><span className={`text-sm font-semibold ${course.isFree ? 'text-green-600' : 'text-blue-600'}`}>{course.isFree ? 'Free' : `₦${Number(course.price).toLocaleString()}`}</span>{course.rating && course.rating > 0 ? <span className="flex items-center gap-1 text-yellow-500 text-sm"><StarIcon className="w-4 h-4 fill-current" />{Number(course.rating).toFixed(1)}</span> : null}</div>
            </div>
          </Link>)}
        </div>
      )}
    </div>
  );
}
