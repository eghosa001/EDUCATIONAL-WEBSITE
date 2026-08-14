'use client';

import { ClockIcon, BookOpenIcon, PlayIcon } from 'lucide-react';
import Link from 'next/link';

const recentItems = [
  { id: '1', title: 'Mitosis and Meiosis', type: 'lesson', course: 'Biology SS2', time: '30 min ago' },
  { id: '2', title: 'Calculus — Derivatives', type: 'lesson', course: 'Mathematics SSS1', time: '2 hours ago' },
  { id: '3', title: 'JAMB English Practice', type: 'exam', course: 'English Language', time: 'Yesterday' },
  { id: '4', title: 'Organic Chemistry Basics', type: 'lesson', course: 'Chemistry SSS2', time: '2 days ago' },
];

export default function RecentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recent Activity</h1>

      {recentItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <ClockIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No recent activity</p>
          <Link href="/dashboard/courses" className="mt-4 inline-block text-blue-600 text-sm font-medium">Start Learning</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recentItems.map(item => (
            <Link key={item.id} href={item.type === 'exam' ? `/dashboard/exams` : `/dashboard/lessons`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'exam' ? 'bg-red-100' : 'bg-blue-100'}`}>
                  {item.type === 'exam' ? <PlayIcon className="w-5 h-5 text-red-600" /> : <BookOpenIcon className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.course}</p>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
