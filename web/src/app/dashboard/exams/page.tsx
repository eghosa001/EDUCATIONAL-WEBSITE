'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { fetchExams } from '@/services/api/examService';
import { ClockIcon, BookOpenIcon, TrophyIcon, AlertCircleIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ExamItem {
  id: string;
  title: string;
  description?: string;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  questionCount?: number;
}

const typeColors: Record<string, string> = {
  past_questions: 'bg-blue-100 text-blue-700',
  practice: 'bg-green-100 text-green-700',
  mock: 'bg-purple-100 text-purple-700',
  timed_test: 'bg-orange-100 text-orange-700',
  full_examination: 'bg-red-100 text-red-700',
};

export default function ExamsPage() {
  const { token } = useAuth();
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchExams({ page: 1, limit: 50 }, token)
      .then(res => setExams((res.data || []) as unknown as ExamItem[]))
      .catch(() => [])
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = filter === 'all' ? exams : exams.filter(e => e.exam_type === filter);
  const types = [...new Set(exams.map(e => e.exam_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Exams</h1>
          <p className="text-gray-500 mt-1">Test yourself with past WAEC, NECO, and JAMB questions</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All ({exams.length})
        </button>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === t ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t.replace(/_/g, ' ')} ({exams.filter(e => e.exam_type === t).length})
          </button>
        ))}
      </div>

      {/* Exam cards */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No exams available yet.</p>
          <p className="text-sm text-gray-400 mt-1">Check back soon for new practice tests.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(exam => (
            <Link
              key={exam.id}
              href={`/dashboard/exams/${exam.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[exam.exam_type] || 'bg-gray-100 text-gray-600'}`}>
                  {exam.exam_type.replace(/_/g, ' ')}
                </span>
                {!exam.is_active && (
                  <AlertCircleIcon className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                {exam.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{exam.description}</p>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <ClockIcon className="w-4 h-4" />
                  {exam.duration_minutes} min
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <TrophyIcon className="w-4 h-4" />
                  {exam.total_marks} marks
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
