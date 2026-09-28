'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpenIcon, ChevronLeft, ChevronRight, FileQuestionIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getLearnerApiHeaders, handleApiResponse, learnerApiConfig } from '@/services/api/config';

type SubjectRow = { id: string; name: string };
type Question = {
  id: string;
  board: string;
  year: number | null;
  subject_id: string | null;
  question_type: 'mcq' | 'essay' | string;
  question_text: string;
  question_image_url?: string | null;
  options: unknown;
  difficulty?: string | null;
  marks?: number | null;
  hasAnswer: boolean;
  storageBacked?: boolean;
};
type Pagination = { page: number; limit: number; total: number; totalPages: number };

const BOARDS = [
  { value: 'jamb', label: 'JAMB / UTME' },
  { value: 'waec', label: 'WAEC' },
  { value: 'neco', label: 'NECO' },
  { value: 'nabteb', label: 'NABTEB' },
];

function optionsOf(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item: any, index) => ({
      id: String(item?.id ?? item?.label ?? String.fromCharCode(65 + index)),
      text: String(item?.text ?? item?.value ?? item ?? ''),
    })).filter(item => item.text);
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([id, item]: any) => ({
      id,
      text: String(item?.text ?? item?.value ?? item ?? ''),
    })).filter(item => item.text);
  }
  return [];
}

export default function ExtractedQuestionBankPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [board, setBoard] = useState('waec');
  const [subjectId, setSubjectId] = useState('');
  const [year, setYear] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('subjects').select('id,name').eq('is_active', true).order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setSubjects((data || []) as SubjectRow[]);
      });
  }, []);

  const subjectName = useMemo(() => subjects.find(item => item.id === subjectId)?.name || '', [subjects, subjectId]);

  const load = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ board, page: String(page), limit: '20' });
      if (subjectId) params.set('subjectId', subjectId);
      if (year) params.set('year', year);
      if (questionType) params.set('questionType', questionType);
      const response = await fetch(`${learnerApiConfig.baseUrl}/past-questions?${params.toString()}`, {
        headers: getLearnerApiHeaders(token ?? undefined),
        credentials: learnerApiConfig.credentials,
      });
      const payload = await handleApiResponse<any>(response);
      setQuestions(payload?.data?.questions || []);
      setPagination(payload?.pagination || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load extracted questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
    // load is driven by explicit filter state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, subjectId, year, questionType, token]);

  return <div className="space-y-6">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link href="/dashboard/past-questions" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"><ArrowLeft className="h-4 w-4"/>Back to CBT</Link>
        <h1 className="text-2xl font-bold text-[#151A3A] dark:text-white">Extracted Question Bank</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500 dark:text-slate-400">These are questions extracted from the private Supabase source files and stored as website content. Learners do not receive the PDFs.</p>
      </div>
      <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-[#151A3A] dark:bg-brand-950/30 dark:text-white">{pagination.total.toLocaleString()} matching questions</div>
    </header>

    <section className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-700 dark:bg-[#1b2045]">
      <label className="text-sm font-medium">Exam board<select value={board} onChange={event => { setBoard(event.target.value); setYear(''); }} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-slate-700 dark:bg-[#151A3A]">{BOARDS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="text-sm font-medium">Subject<select value={subjectId} onChange={event => setSubjectId(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-slate-700 dark:bg-[#151A3A]"><option value="">All subjects</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
      <label className="text-sm font-medium">Year<input value={year} onChange={event => setYear(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="All years" className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-slate-700 dark:bg-[#151A3A]"/></label>
      <label className="text-sm font-medium">Question type<select value={questionType} onChange={event => setQuestionType(event.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 dark:border-slate-700 dark:bg-[#151A3A]"><option value="">All types</option><option value="mcq">Multiple choice</option><option value="essay">Essay / theory</option></select></label>
    </section>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

    {loading ? <div className="rounded-2xl border border-stone-200 bg-white py-16 text-center text-slate-500 dark:border-slate-700 dark:bg-[#1b2045]">Loading extracted questions…</div> :
    questions.length === 0 ? <div className="rounded-2xl border border-stone-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-[#1b2045]"><FileQuestionIcon className="mx-auto h-10 w-10 text-slate-300"/><p className="mt-3 font-semibold">No extracted questions match these filters yet.</p></div> :
    <div className="space-y-4">{questions.map((question, index) => {
      const options = optionsOf(question.options);
      return <article key={question.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><span>{question.board}</span>{question.year && <span>• {question.year}</span>}<span>• {question.question_type === 'mcq' ? 'Multiple choice' : 'Essay / theory'}</span>{question.storageBacked && <span className="rounded-full bg-emerald-50 px-2 py-1 normal-case text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">Extracted from Storage</span>}</div>
        <p className="mt-3 font-semibold leading-7 text-slate-900 dark:text-white">{(pagination.page - 1) * pagination.limit + index + 1}. {question.question_text}</p>
        {question.question_image_url && <img src={question.question_image_url} alt="Question illustration" className="mt-4 max-h-72 rounded-xl object-contain"/>}
        {options.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2">{options.map(option => <div key={option.id} className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-[#151A3A]"><b>{option.id}.</b> {option.text}</div>)}</div>}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">{subjectName && subjectId === question.subject_id && <span>{subjectName}</span>}<span>{question.hasAnswer ? 'Answer key available for CBT' : 'Practice-only / no verified answer key'}</span>{question.marks ? <span>{question.marks} mark{question.marks === 1 ? '' : 's'}</span> : null}</div>
      </article>;
    })}</div>}

    {pagination.totalPages > 1 && <nav className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1b2045]"><button onClick={() => void load(Math.max(1, pagination.page - 1))} disabled={pagination.page <= 1 || loading} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"><ChevronLeft className="h-4 w-4"/>Previous</button><span className="text-sm text-slate-500">Page {pagination.page} of {pagination.totalPages}</span><button onClick={() => void load(Math.min(pagination.totalPages, pagination.page + 1))} disabled={pagination.page >= pagination.totalPages || loading} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next<ChevronRight className="h-4 w-4"/></button></nav>}
  </div>;
}
