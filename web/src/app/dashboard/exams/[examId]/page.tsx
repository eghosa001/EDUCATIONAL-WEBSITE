'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, Clock3, Flag, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiConfig, getAuthHeaders, handleApiResponse } from '@/services/api/config';

type Answers = Record<string, unknown>;
interface Exam {
  id: string;
  title: string;
  description?: string | null;
  duration_minutes?: number;
  passing_marks?: number;
  instructions?: string | null;
  is_timed?: boolean;
}
interface AttemptQuestion {
  id: string;
  questionId: string;
  questionText: string;
  questionType: string;
  options: any[];
  marks: number;
  orderIndex: number;
  sectionName?: string;
  difficulty?: string;
}
const optionText = (value: any) => typeof value === 'string' ? value : value?.text ?? value?.label ?? value?.value ?? String(value ?? '');
const optionValue = (value: any, index: number) => value?.id ?? value?.value ?? value?.label ?? String.fromCharCode(65 + index);

export default function ExamAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const examId = String(params?.examId || '');
  const [exam, setExam] = useState<Exam | null>(null);
  const [questionCount, setQuestionCount] = useState(0);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<'instructions' | 'exam'>('instructions');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sectionTab, setSectionTab] = useState('all');

  useEffect(() => {
    if (!examId || !token) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiConfig.baseUrl}/exams/${examId}`, {
          headers: getAuthHeaders(token),
          credentials: apiConfig.credentials,
        });
        const payload = await handleApiResponse<{ data: { exam: Exam; stats: { questionCount: number } } }>(response);
        if (!cancelled) {
          setExam(payload.data.exam);
          setQuestionCount(Number(payload.data.stats?.questionCount || 0));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load CBT');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [examId, token]);

  const startExam = async () => {
    if (!exam || !token || starting) return;
    setStarting(true);
    setError('');
    try {
      const response = await fetch(`${apiConfig.baseUrl}/exams/${examId}/attempts`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: apiConfig.credentials,
      });
      const payload = await handleApiResponse<{
        data: {
          attempt: { id: string };
          exam: { durationMinutes: number; isTimed: boolean; totalQuestions: number };
          questions: Array<{
            id: string; questionId: string; questionText: string; questionType: string; options?: any[];
            marks: number; orderIndex: number; sectionName?: string; difficulty?: string;
          }>;
        };
      }>(response);
      const mapped: AttemptQuestion[] = (payload.data.questions || []).map((q) => ({
        id: q.id,
        questionId: q.questionId,
        questionText: q.questionText,
        questionType: q.questionType,
        options: Array.isArray(q.options) ? q.options : [],
        marks: Number(q.marks || 1),
        orderIndex: Number(q.orderIndex || 0),
        sectionName: q.sectionName || undefined,
        difficulty: q.difficulty || undefined,
      }));
      if (!mapped.length) throw new Error('This CBT has no available questions.');
      const duration = Number(payload.data.exam.durationMinutes || exam.duration_minutes || 60);
      setAttemptId(payload.data.attempt.id);
      setQuestions(mapped);
      setQuestionCount(mapped.length);
      setSecondsLeft(duration * 60);
      setCurrent(0);
      setAnswers({});
      setFlagged(new Set());
      setStartedAt(Date.now());
      setPhase('exam');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to start this exam');
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (phase !== 'exam' || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, secondsLeft]);

  const sections = useMemo(() => [...new Set(questions.map((q) => q.sectionName).filter(Boolean) as string[])], [questions]);
  const visible = useMemo(() => sectionTab === 'all' ? questions : questions.filter((q) => q.sectionName === sectionTab), [questions, sectionTab]);
  useEffect(() => { if (current >= visible.length) setCurrent(0); }, [current, visible.length]);
  const question = visible[current];
  const answered = questions.filter((item) => answers[item.questionId] !== undefined && answers[item.questionId] !== '').length;
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  const submit = async (automatic = false) => {
    if (submitting || !startedAt || !exam || !attemptId || !token) return;
    if (!automatic && !window.confirm(`Submit this CBT? ${questions.length - answered} question(s) are unanswered.`)) return;
    setSubmitting(true);
    setError('');
    try {
      const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
      const response = await fetch(`${apiConfig.baseUrl}/exams/${examId}/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        credentials: apiConfig.credentials,
        body: JSON.stringify({
          answers: Object.entries(answers).map(([questionId, studentAnswer]) => ({ questionId, studentAnswer })),
          timeSpentSeconds: elapsed,
        }),
      });
      const payload = await handleApiResponse<{
        data: {
          result: {
            score: number; totalMarks: number; percentage: number; isPassed: boolean;
            correctCount: number; incorrectCount: number; unansweredCount: number; showResults: boolean;
          };
        };
      }>(response);
      const result = payload.data.result;
      window.localStorage.setItem(`exam_result_${examId}`, JSON.stringify({
        examTitle: exam.title,
        attemptId,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        isPassed: result.isPassed,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        unansweredCount: result.unansweredCount,
        showResults: result.showResults,
        timeSpent: formatTime(elapsed),
        answers: [],
      }));
      router.push(`/dashboard/exams/${examId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (phase === 'exam' && secondsLeft === 0 && startedAt && !submitting) void submit(true);
  }, [secondsLeft, phase, startedAt, submitting]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-brand-600" /></div>;
  if (error && !exam) return <div className="mx-auto max-w-2xl py-16 text-center"><AlertCircle className="mx-auto h-12 w-12 text-red-500" /><h1 className="mt-4 text-xl font-bold">Unable to load CBT</h1><p className="mt-2 text-slate-500">{error}</p><Link href="/dashboard/exams" className="mt-6 inline-flex rounded-xl bg-[#151A3A] px-5 py-2.5 font-semibold text-white">Back to exams</Link></div>;
  if (!exam) return null;

  if (phase === 'instructions') return <div className="mx-auto max-w-3xl space-y-6"><Link href="/dashboard/exams" className="inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />Back to exams</Link><div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><h1 className="text-3xl font-extrabold text-[#151A3A] dark:text-white">{exam.title}</h1><p className="mt-2 text-slate-500 dark:text-slate-300">{exam.description}</p>{error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="mt-7 grid grid-cols-3 gap-4"><div className="rounded-xl bg-stone-50 p-4 text-center"><b className="block text-2xl">{questionCount}</b><span className="text-sm text-slate-500">Questions</span></div><div className="rounded-xl bg-stone-50 p-4 text-center"><b className="block text-2xl">{exam.duration_minutes || 60}m</b><span className="text-sm text-slate-500">Duration</span></div><div className="rounded-xl bg-stone-50 p-4 text-center"><b className="block text-2xl">{exam.passing_marks || 50}</b><span className="text-sm text-slate-500">Pass mark</span></div></div>{exam.instructions && <div className="mt-7 rounded-xl bg-brand-50 p-5 text-sm dark:bg-brand-950/30"><b>Instructions</b><p className="mt-2 whitespace-pre-wrap">{exam.instructions}</p></div>}<button onClick={startExam} disabled={starting || questionCount === 0} className="mt-7 w-full rounded-xl bg-[#151A3A] py-3.5 font-semibold text-white disabled:opacity-50">{starting ? 'Starting…' : `Start CBT (${questionCount} questions)`}</button></div></div>;

  if (!question) return <div className="p-10 text-center">No question available.</div>;
  const selected = answers[question.questionId];
  return <div className="min-h-[calc(100vh-6rem)] space-y-5">{error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#151A3A]/95"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{exam.title}{question.sectionName ? ` · ${question.sectionName}` : ''}</span><span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-sm font-bold ${secondsLeft < 120 ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-800'}`}><Clock3 className="h-4 w-4" />{formatTime(secondsLeft)}</span></div>{sections.length > 1 && <div className="flex gap-2 overflow-x-auto rounded-xl border border-stone-200 bg-white p-2 dark:border-slate-700 dark:bg-[#1b2045]"><button onClick={() => { setSectionTab('all'); setCurrent(0); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${sectionTab === 'all' ? 'bg-[#151A3A] text-white' : 'text-slate-600'}`}>All sections</button>{sections.map((section) => <button key={section} onClick={() => { setSectionTab(section); setCurrent(0); }} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${sectionTab === section ? 'bg-[#151A3A] text-white' : 'text-slate-600'}`}>{section}</button>)}</div>}<div className="grid gap-5 lg:grid-cols-[220px_1fr]"><aside className="rounded-xl border border-stone-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1b2045]"><div className="mb-3 text-xs text-slate-500">Answered {answered}/{questions.length}</div><div className="grid grid-cols-5 gap-2">{visible.map((item, index) => <button key={item.questionId} onClick={() => setCurrent(index)} className={`relative aspect-square rounded-lg text-xs font-semibold ${index === current ? 'bg-brand-50 text-brand-800 ring-2 ring-brand-600' : answers[item.questionId] !== undefined ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-100 text-slate-600'}`}>{index + 1}{flagged.has(item.questionId) && <Flag className="absolute right-0.5 top-0.5 h-2.5 w-2.5 text-amber-600" />}</button>)}</div></aside><main className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-[#1b2045]"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Question {current + 1} of {visible.length}</span><button onClick={() => setFlagged((previous) => { const next = new Set(previous); next.has(question.questionId) ? next.delete(question.questionId) : next.add(question.questionId); return next; })} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${flagged.has(question.questionId) ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-slate-500'}`}><Flag className="mr-1 inline h-3.5 w-3.5" />{flagged.has(question.questionId) ? 'Flagged' : 'Flag'}</button></div><h2 className="mt-6 text-xl font-semibold leading-8 text-[#151A3A] dark:text-white">{question.questionText}</h2><div className="mt-6 space-y-3">{question.options.map((option, index) => { const value = optionValue(option, index); return <button key={String(value)} onClick={() => setAnswers((previous) => ({ ...previous, [question.questionId]: value }))} className={`w-full rounded-xl border p-4 text-left ${String(selected) === String(value) ? 'border-brand-600 bg-brand-50 text-brand-900 dark:bg-brand-950/30 dark:text-brand-200' : 'border-stone-200 hover:border-brand-300 dark:border-slate-700'}`}><span className="mr-3 font-bold">{String(value)}.</span>{optionText(option)}</button>; })}</div>{question.options.length === 0 && <textarea value={String(selected ?? '')} onChange={(event) => setAnswers((previous) => ({ ...previous, [question.questionId]: event.target.value }))} rows={6} className="mt-6 w-full rounded-xl border border-stone-300 p-4" placeholder="Type your answer…" />}<div className="mt-8 flex items-center justify-between gap-3"><button disabled={current === 0} onClick={() => setCurrent((value) => value - 1)} className="rounded-xl border px-4 py-2.5 disabled:opacity-40">Previous</button>{current === visible.length - 1 ? <button onClick={() => void submit(false)} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50">{submitting ? 'Submitting…' : <><CheckCircle2 className="h-4 w-4" />Submit CBT</>}</button> : <button onClick={() => setCurrent((value) => value + 1)} className="rounded-xl bg-[#151A3A] px-5 py-2.5 font-semibold text-white">Next</button>}</div></main></div></div>;
}
