'use client';

import { useEffect, useState } from 'react';
import { UsersIcon, TrendingUpIcon, StarIcon } from 'lucide-react';

const mockChildren = [
  { id: '1', name: 'Emeka Johnson', age: 12, grade: 'JSS 2', school: 'Federal Government College', avgScore: 78, streak: 5 },
  { id: '2', name: 'Aisha Johnson', age: 9, grade: 'Primary 4', school: 'Grace International School', avgScore: 85, streak: 12 },
];

export default function ParentPage() {
  const [children, setChildren] = useState(mockChildren);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
        <p className="text-gray-500 mt-1">Monitor your children's learning progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map(child => (
          <div key={child.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
                {child.name[0]}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{child.name}</h3>
                <p className="text-sm text-gray-500">{child.grade} · {child.school}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{child.avgScore}%</p>
                <p className="text-xs text-gray-500">Avg Score</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{child.streak}</p>
                <p className="text-xs text-gray-500">Day Streak</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{child.age}</p>
                <p className="text-xs text-gray-500">Years Old</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Study Time</span>
                <span className="font-medium text-gray-900">14h 32m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Lessons Completed</span>
                <span className="font-medium text-gray-900">43</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Exams Taken</span>
                <span className="font-medium text-gray-900">8</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Performance Areas</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Mathematics</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">English</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">Science</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
