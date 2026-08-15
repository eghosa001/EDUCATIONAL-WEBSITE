'use client';

import { useState } from 'react';
import { BookmarkIcon, BookOpenIcon, StarIcon } from 'lucide-react';

export default function SavedPage() {
  const [savedItems] = useState([]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Items</h1>
        <p className="text-gray-500 mt-1">Your bookmarked lessons and resources</p>
      </div>

      {savedItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <BookmarkIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No saved items yet</p>
          <p className="text-sm mt-1">Lessons you save will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savedItems.map((item: any) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <BookOpenIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500">{item.course}</p>
              </div>
              <StarIcon className="w-5 h-5 text-yellow-500" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
