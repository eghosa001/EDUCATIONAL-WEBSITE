'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  Clock3,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPastQuestionInsights,
  type PastQuestionInsights,
} from '@/services/api/pastQuestionAnalyticsService';

const emptyInsights: PastQuestionInsights = {
  sessions: 0,
  questions: 0,
  correct: 0,
  accuracy: 0,
  timeSpentSeconds: 0,
  boards: [],
  subjects: [],
  strongTopics: [],
  weakTopics: [],
  weakSubjects: [],
  recentAttempts: [],
};

const boardLabel = (board: string) => {
  const value = String(board || '').toUpperCase();
  return value === 'JAMB' ? 'JAMB / UTME' : value;
};

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, Number(seconds || 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
};

export default function PastQuestionAnalyticsPage() {
  const { token } = useAuth();
  const [insights, setInsights] = useState<PastQuestionInsights>(emptyInsights);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    void fetchPastQuestionInsights(token)
      .then((data) => { if (!cancelled) setInsights(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load past-question analytics'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const maxBoardQuestions = useMemo(
    () => Math.max(1, ...insights.boards.map((board) => board.questions)),
    [insights.boards],
  );

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" /></div>;
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Link href="/dashboard/past-questions" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-brand-700"><ArrowLeft className="h-4 w-4" />Past Questions CBT</Link>
        <h1 className="text-2xl font-extrabold text-[#151A3A] dark:text-white">Past Question Performance</h1>
        <p className="mt-1 text-slate-500">Track how you perform across examination boards, subjects and mapped curriculum topics.</p>
      </div>
      <Link href="/dashboard/past-questions" className="rounded-xl bg-[#151A3A] px-4 py-2.5 text-sm font-semibold text-white">Practice another set</Link>
    </div>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: 'CBT sessions', value: insights.sessions, icon: BarChart3 },
        { label: 'Questions attempted', value: insights.questions, icon: BookOpenCheck },
        { label: 'Overall accuracy', value: `${insights.accuracy}%`, icon: Target },
        { label: 'Practice time', value: formatDuration(insights.timeSpentSeconds), icon: Clock3 },
      ].map((stat) => <div key={stat.label} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{stat.label}</p><p className="mt-2 text-2xl font-extrabold text-[#151A3A] dark:text-white">{stat.value}</p></div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/30"><stat.icon className="h-5 w-5 text-brand-700" /></div>
        </div>
      </div>)}
    </div>

    {!insights.sessions ? <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#1b2045]">
      <BarChart3 className="mx-auto h-12 w-12 text-stone-300" />
      <h2 className="mt-4 text-lg font-bold text-[#151A3A] dark:text-white">No performance history yet</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Complete a JAMB, WAEC, NECO or NABTEB CBT set. Your results will be saved here and used to identify strong and weak areas.</p>
      <Link href="/dashboard/past-questions" className="mt-5 inline-flex rounded-xl bg-[#151A3A] px-5 py-2.5 text-sm font-semibold text-white">Start a CBT</Link>
    </section> : <>
      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
          <h2 className="font-bold text-[#151A3A] dark:text-white">Performance by examination</h2>
          <p className="mt-1 text-sm text-slate-500">Accuracy and question volume across your saved sessions.</p>
          <div className="mt-5 space-y-4">
            {insights.boards.map((board) => <div key={board.board}>
              <div className="mb-1 flex items-center justify-between gap-4 text-sm"><span className="font-semibold text-slate-800 dark:text-slate-100">{boardLabel(board.board)}</span><span className="text-slate-500">{board.accuracy}% · {board.sessions} session{board.sessions === 1 ? '' : 's'}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-slate-700"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.max(4, (board.questions / maxBoardQuestions) * 100)}%` }} /></div>
              <p className="mt-1 text-xs text-slate-400">{board.correct}/{board.questions} correct</p>
            </div>)}
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
          <h2 className="font-bold text-[#151A3A] dark:text-white">Subject accuracy</h2>
          <p className="mt-1 text-sm text-slate-500">Based only on questions you answered.</p>
          <div className="mt-4 space-y-3">
            {insights.subjects.length ? insights.subjects.slice(0, 10).map((subject) => <div key={subject.subjectId} className="rounded-xl bg-stone-50 p-3 dark:bg-[#151A3A]">
              <div className="flex items-center justify-between gap-3"><div><p className="font-semibold text-slate-900 dark:text-white">{subject.subjectName}</p><p className="text-xs text-slate-500">{subject.attempts} answered</p></div><span className={`font-bold ${subject.accuracy >= 75 ? 'text-emerald-600' : subject.accuracy < 60 ? 'text-amber-600' : 'text-brand-700'}`}>{subject.accuracy}%</span></div>
            </div>) : <p className="py-8 text-center text-sm text-slate-500">Subject analytics will appear after your next graded set.</p>}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-950 dark:bg-emerald-950/10">
          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-700" /><h2 className="font-bold text-[#151A3A] dark:text-white">Strong topics</h2></div>
          <p className="mt-1 text-sm text-slate-500">Topic areas with at least three answers and 75%+ accuracy.</p>
          <div className="mt-4 space-y-3">
            {insights.strongTopics.length ? insights.strongTopics.map((topic) => <div key={topic.topicId} className="rounded-xl border border-emerald-100 bg-white p-4 dark:border-emerald-950 dark:bg-[#1b2045]"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold">{topic.topicName}</p><p className="text-xs text-slate-500">{topic.subjectName} · {topic.attempts} answers</p></div><b className="text-emerald-700">{topic.accuracy}%</b></div></div>) : <p className="rounded-xl bg-white/70 p-5 text-center text-sm text-slate-500">No topic has enough evidence yet.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-950 dark:bg-amber-950/10">
          <div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-amber-700" /><h2 className="font-bold text-[#151A3A] dark:text-white">Needs attention</h2></div>
          <p className="mt-1 text-sm text-slate-500">Topic areas below 60% after at least three answers.</p>
          <div className="mt-4 space-y-3">
            {insights.weakTopics.length ? insights.weakTopics.map((topic) => <div key={topic.topicId} className="rounded-xl border border-amber-100 bg-white p-4 dark:border-amber-950 dark:bg-[#1b2045]"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold">{topic.topicName}</p><p className="text-xs text-slate-500">{topic.subjectName} · {topic.correct}/{topic.attempts} correct</p></div><b className="text-amber-700">{topic.accuracy}%</b></div></div>) : insights.weakSubjects.length ? insights.weakSubjects.map((subject) => <div key={subject.subjectId} className="rounded-xl border border-amber-100 bg-white p-4 dark:border-amber-950 dark:bg-[#1b2045]"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold">{subject.subjectName}</p><p className="text-xs text-slate-500">{subject.attempts} answered questions</p></div><b className="text-amber-700">{subject.accuracy}%</b></div></div>) : <p className="rounded-xl bg-white/70 p-5 text-center text-sm text-slate-500">No weak area has enough evidence yet.</p>}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="border-b border-stone-100 px-6 py-4 dark:border-slate-700"><h2 className="font-bold text-[#151A3A] dark:text-white">Recent CBT sessions</h2></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-[#151A3A]"><tr><th className="px-6 py-3">Date</th><th className="px-6 py-3">Exam</th><th className="px-6 py-3">Year</th><th className="px-6 py-3">Score</th><th className="px-6 py-3">Questions</th><th className="px-6 py-3">Time</th></tr></thead>
          <tbody className="divide-y divide-stone-100 dark:divide-slate-700">{insights.recentAttempts.map((attempt) => <tr key={attempt.id}><td className="px-6 py-4 text-slate-600 dark:text-slate-300">{new Date(attempt.submittedAt).toLocaleDateString()}</td><td className="px-6 py-4 font-semibold">{boardLabel(attempt.board)}</td><td className="px-6 py-4 text-slate-500">{attempt.year || 'Mixed'}</td><td className="px-6 py-4 font-bold">{attempt.percentage}%</td><td className="px-6 py-4 text-slate-500">{attempt.correctCount}/{attempt.questionCount}</td><td className="px-6 py-4 text-slate-500">{formatDuration(attempt.timeSpentSeconds)}</td></tr>)}</tbody>
        </table></div>
      </section>
    </>}
  </div>;
}
