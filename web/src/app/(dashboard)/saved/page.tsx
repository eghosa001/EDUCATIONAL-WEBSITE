'use client';

import { BookmarkIcon, BookOpenIcon, StarIcon, ClockIcon } from 'lucide-react';

const savedItems = [
  { id: '1', title: 'Cell Biology Basics', type: 'lesson', course: 'Biology SS2', saved: '2 days ago' },
  { id: '2', title: 'Quadratic Equations', type: 'lesson', course: 'Mathematics SSS1', saved: '5 days ago' },
  { id: '3', title: 'WAEC 2023 Chemistry', type: 'past-question', course: 'Chemistry', saved: '1 week ago' },
];

export default function SavedPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
        <p className="text-gray-500 mt-1">Your bookmarked lessons and resources</p>
      </div>

      {savedItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <BookmarkIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No saved items yet</p>
          <p className="text-sm">Lessons you save will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedItems.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:border-blue-200 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                {item.type === 'lesson' ? <BookOpenIcon className="w-5 h-5 text-blue-600" /> : <StarIcon className="w-5 h-5 text-yellow-500" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.course}</p>
              </div>
              <span className="text-xs text-gray-400 flex items-center gap-1"><ClockIcon className="w-3 h-3" />{item.saved}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
