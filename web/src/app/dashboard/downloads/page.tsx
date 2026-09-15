'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileTextIcon, VideoIcon, DownloadIcon, ImageIcon, BookOpenIcon } from 'lucide-react';
import { useAuthStore } from '@/state/auth/authStore';
import { fetchLibraryResources } from '@/services/api/libraryService';
import type { LibraryResource } from '@/services/api/libraryService';

const typeIcons: Record<string, typeof BookOpenIcon> = { pdf: FileTextIcon, video: VideoIcon, image: ImageIcon, document: BookOpenIcon, audio: BookOpenIcon };
const typeColors: Record<string, string> = { pdf: 'text-red-500', video: 'text-blue-500', image: 'text-green-500', document: 'text-purple-500', audio: 'text-orange-500' };
const hasUsableUrl = (value?: string) => !!value && /^(https?:\/\/|\/)/i.test(value);

export default function DownloadsPage() {
  const { token } = useAuthStore();
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetchLibraryResources({ page: 1, limit: 50 }, token)
      .then(res => setResources((res.data || []).filter(r => hasUsableUrl(r.fileUrl))))
      .catch(err => setError(err instanceof Error ? err.message : 'Unable to load downloads'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"/><p className="text-gray-500">Loading downloads...</p></div></div>;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold text-gray-900">Downloads</h1><p className="mt-1 text-gray-500">Study materials currently available for download</p></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {resources.length===0 ? <div className="rounded-xl border border-gray-200 bg-white py-16 text-center text-gray-500"><DownloadIcon className="mx-auto mb-4 h-12 w-12 text-gray-300"/><p className="font-medium">No downloadable files are published yet</p><p className="mt-1 text-sm">Library records without a source file are kept visible in the Library but cannot be downloaded.</p><Link href="/dashboard/library" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Browse Library</Link></div> : <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{resources.map(resource=>{const Icon=typeIcons[resource.resourceType]||BookOpenIcon; const color=typeColors[resource.resourceType]||'text-gray-500'; return <div key={resource.id} className="rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><Icon className={`h-5 w-5 ${color}`}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-gray-900">{resource.title}</p><p className="mt-0.5 text-xs text-gray-500">{resource.courseTitle||resource.lessonTitle||resource.subjectId||'Resource'}</p></div></div><div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3"><span className="text-xs capitalize text-gray-400">{resource.resourceType}</span><a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1 rounded-lg border border-blue-200 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50"><DownloadIcon className="h-3 w-3"/>Download</a></div></div>;})}</div>}
  </div>;
}
