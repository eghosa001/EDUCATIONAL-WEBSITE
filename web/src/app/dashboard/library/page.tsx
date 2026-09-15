'use client';

import { useEffect, useState } from 'react';
import { FileTextIcon, VideoIcon, ImageIcon, DownloadIcon, BookOpenIcon, LockKeyhole } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchLibraryResources } from '@/services/api/libraryService';
import type { LibraryResource } from '@/services/api/libraryService';

const typeIcons: Record<string, typeof BookOpenIcon> = { pdf: FileTextIcon, video: VideoIcon, image: ImageIcon, document: BookOpenIcon, audio: BookOpenIcon };
const typeColors: Record<string, string> = { pdf: 'text-red-500', video: 'text-blue-500', image: 'text-green-500', document: 'text-purple-500', audio: 'text-orange-500' };
const hasUsableUrl = (value?: string) => !!value && /^(https?:\/\/|\/)/i.test(value);

export default function LibraryPage() {
  const { token } = useAuthStore();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [resourceType, setResourceType] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    fetchLibraryResources({ page: 1, limit: 50 }, token)
      .then(res => setResources(res.data || []))
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load library'))
      .finally(() => setLoading(false));
  }, [token]);

  const categories = ['All', ...new Set(resources.map(r => r.subjectId || 'Other'))];
  const types = ['All', 'pdf', 'video', 'image', 'document', 'audio'];
  const filtered = resources.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || (item.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filter === 'all' || (item.subjectId && item.subjectId.toLowerCase().includes(filter.toLowerCase()));
    const matchesType = resourceType === 'all' || item.resourceType === resourceType;
    return matchesSearch && matchesCategory && matchesType;
  });
  const downloadableCount = resources.filter(r => hasUsableUrl(r.fileUrl)).length;

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"/><p className="text-gray-500">Loading library...</p></div></div>;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900">Digital Library</h1><p className="mt-1 text-gray-500">{resources.length} resources · {downloadableCount} downloadable</p></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <div className="flex flex-col gap-3 sm:flex-row">
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search library..." className="flex-1 rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"/>
      <select value={filter} onChange={e=>setFilter(e.target.value)} className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none">{categories.map(c=><option key={c} value={c==='All'?'all':c}>{c}</option>)}</select>
      <select value={resourceType} onChange={e=>setResourceType(e.target.value)} className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none">{types.map(t=><option key={t} value={t==='All'?'all':t}>{t}</option>)}</select>
    </div>
    {filtered.length===0 ? <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500"><BookOpenIcon className="mx-auto mb-4 h-12 w-12 text-gray-300"/><p className="font-medium">No resources found</p><p className="mt-1 text-sm">Try adjusting your search or filters</p></div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{filtered.map(resource=>{
      const Icon=typeIcons[resource.resourceType]||BookOpenIcon; const color=typeColors[resource.resourceType]||'text-gray-500'; const available=hasUsableUrl(resource.fileUrl);
      return <div key={resource.id} className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><Icon className={`h-5 w-5 ${color}`}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{resource.title}</p><p className="mt-0.5 text-xs text-gray-500">{resource.courseTitle||resource.lessonTitle||resource.subjectId||'Resource'}</p></div></div><div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3"><span className="text-xs capitalize text-gray-400">{resource.resourceType}</span>{available?<a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"><DownloadIcon className="h-3 w-3"/>Download</a>:<span className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-400" title="A source file has not been published for this resource yet"><LockKeyhole className="h-3 w-3"/>File unavailable</span>}</div></div>;
    })}</div>}
  </div>;
}
