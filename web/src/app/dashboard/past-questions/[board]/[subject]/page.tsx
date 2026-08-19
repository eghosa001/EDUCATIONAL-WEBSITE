'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SearchIcon, ArrowLeftIcon, FileTextIcon, DownloadIcon, ExternalLinkIcon, ClockIcon } from 'lucide-react';
import { pastQuestionFilesAPI, formatFileSize, type PastQuestionFile } from '@/api/past-questions/files';
import { useAuthStore } from '@/state/auth/authStore';

export default function PastQuestionsBoardSubjectPage() {
  const params = useParams();
  const board = params?.board as string;
  const subject = params?.subject as string;
  const { token } = useAuthStore();
  const authToken = token ?? undefined;

  const [files, setFiles] = useState<PastQuestionFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (!board) return;
    setLoading(true);
    pastQuestionFilesAPI.listByBoard(board, {
      subject: subject || undefined,
      limit: 100,
    }, authToken)
      .then(res => setFiles(res.data.files))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [board, subject, authToken]);

  const years = [...new Set(files.map(f => f.year).filter(Boolean))].sort((a, b) => (b || 0) - (a || 0)) as number[];

  const filtered = files.filter(f => {
    if (search && !f.file_name.toLowerCase().includes(search.toLowerCase()) && !f.subject.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedYear && f.year !== selectedYear) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/past-questions" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Past Questions
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{board?.toUpperCase()} — {subject}</h1>
        <p className="text-gray-500 mt-1">{files.length} files available</p>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      {years.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedYear(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!selectedYear ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            All Years
          </button>
          {years.map(year => (
            <button key={year} onClick={() => setSelectedYear(selectedYear === year ? null : year)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedYear === year ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {year}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-8">
          <ClockIcon className="w-5 h-5 animate-spin" /> Loading files...
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['File', 'Year', 'Paper', 'Size', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(file => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-900 truncate max-w-xs">{file.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{file.year || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{file.paper_type || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(file.file_size)}</td>
                  <td className="px-4 py-3">
                    {file.is_processed ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {file.questions_extracted} Qs
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">PDF</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <a href={file.public_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                        <ExternalLinkIcon className="w-4 h-4" />
                      </a>
                      <a href={file.public_url} download
                        className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50">
                        <DownloadIcon className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-8 text-center text-gray-500">No files found</div>}
        </div>
      )}
    </div>
  );
}
