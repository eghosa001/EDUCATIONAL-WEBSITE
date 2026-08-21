'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, StarIcon, UsersIcon, ClockIcon, Search } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { getSupabase } from '@/lib/supabase';
import { fetchCourses } from '@/services/api/courseService';
import type { Course } from '@/types/models/course';

type ClassGroup = { id: string; name: string; code: string; orderIndex: number; courses: Course[] };

export default function CoursesPage() {
  const { token } = useAuthStore();
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data: classes, error } = await getSupabase()
          .from('classes')
          .select('id,name,code,order_index')
          .eq('is_active', true)
          .order('order_index', { ascending: true });
        if (error) throw new Error(error.message);

        const results = await Promise.all((classes || []).map(async (cls: any) => {
          const res = await fetchCourses({ classId: cls.id, status: 'published', page: 1, limit: 100 }, token);
          return { id: cls.id, name: cls.name, code: cls.code, orderIndex: cls.order_index, courses: res.data || [] };
        }));
        if (!cancelled) setGroups(results.filter(group => group.courses.length > 0));
      } catch (error) {
        console.error('Failed to load courses by class', error);
        if (!cancelled) setGroups([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredGroups = useMemo(() => groups.map(group => ({
    ...group,
    courses: normalizedSearch
      ? group.courses.filter(course => `${course.title} ${course.shortDescription || ''} ${course.description || ''}`.toLowerCase().includes(normalizedSearch))
      : group.courses,
  })).filter(group => group.courses.length > 0), [groups, normalizedSearch]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <p className="text-gray-500 mt-1">Browse THE GUIDE courses organized by class</p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="flex gap-2 max-w-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </form>

      {loading ? (
        <div className="space-y-8">
          {[1, 2].map(group => (
            <section key={group}>
              <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(card => <div key={card} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"><div className="h-40 bg-gray-200 rounded-lg mb-4" /><div className="h-4 bg-gray-200 rounded w-3/4 mb-2" /><div className="h-3 bg-gray-100 rounded w-full" /></div>)}
              </div>
            </section>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No courses found</h3>
          <p className="text-gray-500 text-sm mt-1">Try another search.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredGroups.map((group) => (
            <section key={group.id}>
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{group.name}</h2>
                  <p className="text-sm text-gray-500">{group.code} · {group.courses.length} course{group.courses.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.courses.map((course) => (
                  <Link key={course.id} href={`/dashboard/courses/${course.id}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
                      {course.thumbnailUrl ? <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <BookOpenIcon className="w-12 h-12 text-blue-400" />}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.shortDescription || course.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        {course.teacherId && <span className="flex items-center gap-1"><UsersIcon className="w-3 h-3" /> Teacher</span>}
                        {course.totalDurationHours ? <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {course.totalDurationHours}h</span> : null}
                        {course.difficulty && <span className="capitalize">{course.difficulty}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <span className={`text-sm font-semibold ${course.isFree ? 'text-green-600' : 'text-blue-600'}`}>{course.isFree ? 'Free' : `₦${Number(course.price).toLocaleString()}`}</span>
                        {course.rating && course.rating > 0 ? <span className="flex items-center gap-1 text-yellow-500 text-sm"><StarIcon className="w-4 h-4 fill-current" />{Number(course.rating).toFixed(1)}</span> : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
