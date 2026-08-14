'use client';

import { useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { BookOpenIcon, UsersIcon, FileTextIcon, ClipboardCheckIcon } from 'lucide-react';

export default function CoursesPage() {
  const { token } = useAdminAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Mock data - replace with API call
    setTimeout(() => {
      setCourses([
        { id: '1', title: 'SS2 Biology', teacher: 'Mr. Adeyemi', status: 'published', students: 45 },
        { id: '2', title: 'SS1 Mathematics', teacher: 'Mrs. Okonkwo', status: 'published', students: 38 },
        { id: '3', title: 'JSS3 English', teacher: 'Mr. Bello', status: 'draft', students: 0 },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));
  const stats = { total: courses.length, published: courses.filter(c => c.status === 'published').length, drafts: courses.filter(c => c.status === 'draft').length };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">+ New Course</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[{ label: 'Total', value: stats.total, icon: BookOpenIcon, color: 'blue' },
          { label: 'Published', value: stats.published, icon: ClipboardCheckIcon, color: 'green' },
          { label: 'Drafts', value: stats.drafts, icon: FileTextIcon, color: 'yellow' }].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-100">
            {['Title', 'Teacher', 'Status', 'Students', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
            ))}
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(course => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{course.title}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{course.teacher}</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{course.status}</span></td>
                <td className="px-4 py-3 text-sm text-gray-500">{course.students}</td>
                <td className="px-4 py-3"><button className="text-sm text-blue-600 hover:text-blue-700 mr-3">Edit</button><button className="text-sm text-red-600 hover:text-red-700">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
