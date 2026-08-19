'use client';

import { useEffect, useState } from 'react';
import { FileTextIcon, VideoIcon, ImageIcon, DownloadIcon, BookOpenIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchLibraryResources } from '@/services/api/libraryService';
import type { LibraryResource } from '@/services/api/libraryService';

const typeIcons: Record<string, typeof BookOpenIcon> = {
  pdf: FileTextIcon,
  video: VideoIcon,
  image: ImageIcon,
  document: BookOpenIcon,
  audio: BookOpenIcon,
};

const typeColors: Record<string, string> = {
  pdf: 'text-red-500',
  video: 'text-blue-500',
  image: 'text-green-500',
  document: 'text-purple-500',
  audio: 'text-orange-500',
};

export default function LibraryPage() {
  const { token } = useAuthStore();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [resourceType, setResourceType] = useState('all');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchLibraryResources({ page: 1, limit: 50 }, token)
      .then(res => setResources(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const categories = ['All', ...new Set(resources.map(r => r.subjectId || 'Other'))];
  const types = ['All', 'pdf', 'video', 'image', 'document', 'audio'];

  const filtered = resources.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filter === 'all' || (item.subjectId && item.subjectId.toLowerCase().includes(filter.toLowerCase()));
    const matchesType = resourceType === 'all' || item.resourceType === resourceType;
    return matchesSearch && matchesCategory && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Library</h1>
        <p className="text-gray-500 mt-1">{resources.length} resources available</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search library..."
          className="flex-1 px-3 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none"
        >
          {categories.map(c => (
            <option key={c} value={c === 'All' ? 'all' : c}>{c}</option>
          ))}
        </select>
        <select
          value={resourceType}
          onChange={e => setResourceType(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none"
        >
          {types.map(t => (
            <option key={t} value={t === 'All' ? 'all' : t}>{t}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <BookOpenIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">No resources found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => {
            const Icon = typeIcons[resource.resourceType] || BookOpenIcon;
            const color = typeColors[resource.resourceType] || 'text-gray-500';
            return (
              <div key={resource.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{resource.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {resource.courseTitle || resource.lessonTitle || resource.subjectId || 'Resource'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400 capitalize">{resource.resourceType}</span>
                  <a
                    href={resource.fileUrl}
                    download
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <DownloadIcon className="w-3 h-3" /> Download
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
