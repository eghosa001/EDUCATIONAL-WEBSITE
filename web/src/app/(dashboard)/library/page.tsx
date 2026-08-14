'use client';

import { useState } from 'react';
import { FileTextIcon, VideoIcon, ImageIcon, DownloadIcon } from 'lucide-react';

const libraryItems = [
  { id: '1', title: 'Nigerian History Textbook', type: 'pdf', category: 'History', downloads: 342 },
  { id: '2', title: 'WAEC Physics Past Questions 2020-2023', type: 'pdf', category: 'Physics', downloads: 1205 },
  { id: '3', title: 'Introduction to Programming Video', type: 'video', category: 'Computer Science', downloads: 567 },
  { id: '4', title: 'Human Anatomy Diagrams', type: 'image', category: 'Biology', downloads: 234 },
  { id: '5', title: 'English Grammar Handbook', type: 'pdf', category: 'English', downloads: 891 },
  { id: '6', title: 'JAMB Mathematics Guide', type: 'pdf', category: 'Mathematics', downloads: 1543 },
];

const typeIcons = { pdf: FileTextIcon, video: VideoIcon, image: ImageIcon };
const typeColors = { pdf: 'text-red-500', video: 'text-blue-500', image: 'text-green-500' };

export default function LibraryPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [resourceType, setResourceType] = useState('all');

  const filtered = libraryItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filter === 'all' || item.category === filter;
    const matchesType = resourceType === 'all' || item.type === resourceType;
    return matchesSearch && matchesCategory && matchesType;
  });

  const categories = ['All', ...new Set(libraryItems.map(i => i.category))];
  const types = ['All', 'PDF', 'Video', 'Image'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Digital Library</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search library..." className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
          {categories.map(c => <option key={c} value={c === 'All' ? 'all' : c}>{c}</option>)}
        </select>
        <select value={resourceType} onChange={e => setResourceType(e.target.value)} className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none">
          {types.map(t => <option key={t} value={t === 'All' ? 'all' : t.toLowerCase()}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const Icon = typeIcons[item.type as keyof typeof typeIcons] || FileTextIcon;
          return (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${typeColors[item.type as keyof typeof typeColors]}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.category} · {item.type.toUpperCase()}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400">{item.downloads.toLocaleString()} downloads</span>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                  <DownloadIcon className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <div className="text-center py-12 text-gray-500">No results found</div>}
    </div>
  );
}
