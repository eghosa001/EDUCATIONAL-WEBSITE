'use client';

import { BookOpenIcon, TrendingUp, WalletIcon, ClipboardCheckIcon } from 'lucide-react';

export default function TeacherPage() {
  const stats = [
    { label: 'My Courses', value: '3', icon: BookOpenIcon, color: 'blue' },
    { label: 'Active Students', value: '142', icon: TrendingUp, color: 'green' },
    { label: 'Earnings', value: '₦45,200', icon: WalletIcon, color: 'purple' },
    { label: 'Assignments Graded', value: '89', icon: ClipboardCheckIcon, color: 'orange' },
  ];

  const courses = [
    { title: 'SS2 Biology — Cell Biology', students: 45, progress: 72 },
    { title: 'SS1 Mathematics — Algebra', students: 38, progress: 58 },
    { title: 'JSS3 English Language', students: 52, progress: 45 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage your courses and students</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-lg bg-${s.color}-100 flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 text-${s.color}-600`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">My Courses</h2>
        <div className="space-y-3">
          {courses.map((course, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {course.title[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{course.title}</p>
                <p className="text-xs text-gray-500">{course.students} students · {course.progress}% complete</p>
                <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
              <button className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">Manage</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
