'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { learnerApiConfig, getLearnerApiHeaders, handleApiResponse } from '@/services/api/config';
import { AlertCircle, BookOpen, Clock3, Loader2, Trophy } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  exam_type: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  questionCount: number;
}

const labels: Record<string, string> = {
  past_questions: 'Past Questions',
  practice: 'Practice',
  mock: 'Mock',
  timed_test: 'Timed Test',
  full_examination: 'Full Examination',
  subject_test: 'Subject Test',
  topic_test: 'Topic Test',
};

export default function ExamsPage() {
  const { token } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`${learnerApiConfig.baseUrl}/exams?limit=100`, {
          headers: getLearnerApiHeaders(token),
          credentials: learnerApiConfig.credentials,
        });
        const payload = await handleApiResponse<{ data: { exams: Exam[] } }>(response);
        if (!cancelled) setExams((payload.data?.exams || []).filter((exam) => exam.questionCount > 0));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load exams');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  const types = [...new Set(exams.map((exam) => exam.exam_type))];
  const filtered = filter === 'all' ? exams : exams.filter((exam) => exam.exam_type === filter);

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-brand-600" /></div>;
  }

  return <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-extrabold text-[#151A3A] dark:text-white">Practice Exams</h1>
      <p className="mt-1 text-slate-500">Practice with structured questions and review every explanation.</p>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="flex flex-wrap gap-2">
      <button onClick={() => setFilter('all')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === 'all' ? 'bg-[#151A3A] text-white' : 'border border-stone-200 bg-white text-slate-600'}`}>All ({exams.length})</button>
      {types.map((type) => <button key={type} onClick={() => setFilter(type)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${filter === type ? 'bg-[#151A3A] text-white' : 'border border-stone-200 bg-white text-slate-600'}`}>{labels[type] || type.replace(/_/g, ' ')} ({exams.filter((exam) => exam.exam_type === type).length})</button>)}
    </div>
    {!filtered.length ? <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
      <BookOpen className="mx-auto h-12 w-12 text-slate-300" />
      <p className="mt-4 text-slate-500">{error ? 'Exams could not be loaded.' : 'No exams with questions are available yet.'}</p>
    </div> : <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
      {filtered.map((exam) => <Link key={exam.id} href={`/dashboard/exams/${exam.id}`} className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-brand-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="flex items-start justify-between">
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 dark:bg-brand-950/40 dark:text-brand-300">{labels[exam.exam_type] || exam.exam_type.replace(/_/g, ' ')}</span>
          {!exam.is_active && <AlertCircle className="h-4 w-4 text-amber-500" />}
        </div>
        <h2 className="mt-4 line-clamp-2 font-bold text-[#151A3A] group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">{exam.title}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{exam.description}</p>
        <div className="mt-5 flex items-center gap-4 border-t border-stone-100 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock3 className="h-4 w-4" />{exam.duration_minutes} min</span>
          <span className="flex items-center gap-1"><Trophy className="h-4 w-4" />{exam.total_marks} marks</span>
          <span className="ml-auto font-semibold text-brand-700">{exam.questionCount} questions</span>
        </div>
      </Link>)}
    </div>}
  </div>;
}
