'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpenIcon, ArrowLeftIcon, FileTextIcon, ClockIcon } from 'lucide-react';
import { pastQuestionFilesAPI, formatFileSize, type SubjectInfo } from '@/api/past-questions/files';
import { useAuthStore } from '@/state/auth/authStore';

export default function PastQuestionsBoardPage() {
  const params = useParams();
  const board = params?.board as string;
  const { token } = useAuthStore();
  const authToken = token ?? undefined;

  const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!board) return;
    setLoading(true);
    pastQuestionFilesAPI.getSubjectsByBoard(board, authToken)
      .then(res => setSubjects(res.data.subjects))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [board, authToken]);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/past-questions" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Past Questions
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">{board?.toUpperCase()} Past Questions</h1>
        <p className="text-gray-500 mt-1">Select a subject to view available papers</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-8">
          <ClockIcon className="w-5 h-5 animate-spin" /> Loading subjects...
        </div>
      ) : subjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(subject => (
            <Link
              key={subject.subject}
              href={`/dashboard/past-questions/${board}/${encodeURIComponent(subject.subject)}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <BookOpenIcon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{subject.subject}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>{subject.file_count} files</span>
                    <span>{formatFileSize(subject.total_mb * 1024 * 1024)}</span>
                    {subject.min_year && subject.max_year && (
                      <span>{subject.min_year}–{subject.max_year}</span>
                    )}
                  </div>
                </div>
                {subject.all_processed && (
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">Processed</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No subjects found for this board.</p>
        </div>
      )}
    </div>
  );
}
