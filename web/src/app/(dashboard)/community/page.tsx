'use client';

import { useState } from 'react';
import { MessageCircleIcon, PlusIcon, SearchIcon } from 'lucide-react';

const discussions = [
  { id: '1', title: 'Help with JAMB Chemistry preparation', author: 'Tunde A.', replies: 12, likes: 8, time: '2h ago', tags: ['Chemistry', 'JAMB'] },
  { id: '2', title: 'Best strategies for WAEC Mathematics', author: 'Chioma O.', replies: 24, likes: 15, time: '5h ago', tags: ['Mathematics', 'WAEC'] },
  { id: '3', title: 'Study group for SS3 Physics', author: 'Emeka N.', replies: 6, likes: 4, time: '1d ago', tags: ['Physics', 'SS3'] },
  { id: '4', title: 'How to improve English comprehension', author: 'Amina B.', replies: 18, likes: 22, time: '2d ago', tags: ['English', 'General'] },
];

export default function CommunityPage() {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const filtered = discussions.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const tags = [...new Set(discussions.flatMap(d => d.tags))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-500 mt-1">Discuss, ask questions, and learn together</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
          <PlusIcon className="w-4 h-4" /> New Discussion
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search discussions..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
        </div>
        <select className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
          <option>Latest</option>
          <option>Popular</option>
          <option>Unanswered</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedTag === tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tag}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">No discussions found</div>
        ) : (
          filtered.map(d => (
            <div key={d.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 transition-colors cursor-pointer">
              <h3 className="font-medium text-gray-900">{d.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>by {d.author}</span>
                <span className="flex items-center gap-1"><MessageCircleIcon className="w-4 h-4" /> {d.replies} replies</span>
                <span>{d.time}</span>
              </div>
              <div className="flex gap-2 mt-2">
                {d.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
