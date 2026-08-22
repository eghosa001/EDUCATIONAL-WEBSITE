'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Flag, Loader2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { fetchExamById, startExamAttempt, submitExamAttempt } from '@/services/api/examService';

interface Question { id: string; questionId: string; questionText: string; questionType: string; options: any[]; correctAnswer?: any; explanation?: string; marks: number; orderIndex: number; difficulty?: string; }
interface Exam { id: string; title: string; description: string | null; duration_minutes: number; total_marks: number; passing_marks: number; instructions: string | null; shuffle_questions: boolean; is_timed: boolean; }

type Answers = Record<string, any>;

const optionText = (option: any) => typeof option === 'string' ? option : option?.text ?? option?.label ?? option?.value ?? String(option ?? '');
const normalizeAnswer = (value: any) => typeof value === 'object' && value !== null ? value.id ?? value.value ?? value.text : value;

export default function ExamAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const examId = String(params?.examId || '');
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
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

  useEffect(() => {
    if (!examId || !token) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const supabase = getSupabase();
        const { data: examRow, error: examError } = await supabase.from('exams').select('*').eq('id', examId).maybeSingle();
        if (examError || !examRow) throw new Error(examError?.message || 'Exam not found');
        const { data: links, error: linkError } = await supabase.from('exam_questions').select('id,exam_id,question_id,order_index,marks,section_name').eq('exam_id', examId).order('order_index', { ascending: true });
        if (linkError) throw linkError;
        const ids = (links || []).map((x: any) => x.question_id);
        const { data: rows, error: questionError } = ids.length ? await supabase.from('questions').select('id,question_text,question_type,options,correct_answer,explanation,difficulty,marks').in('id', ids) : { data: [], error: null } as any;
        if (questionError) throw questionError;
        const byId = new Map((rows || []).map((q: any) => [q.id, q]));
        const mapped = (links || []).map((link: any) => { const q: any = byId.get(link.question_id); return q ? { id: link.id, questionId: q.id, questionText: q.question_text, questionType: q.question_type, options: Array.isArray(q.options) ? q.options : [], correctAnswer: q.correct_answer, explanation: q.explanation, difficulty: q.difficulty, marks: Number(link.marks ?? q.marks ?? 1), orderIndex: link.order_index } : null; }).filter(Boolean) as Question[];
        if (!mapped.length) throw new Error('This exam has no available questions.');
        if (!cancelled) { setExam(examRow as Exam); setQuestions(mapped); setSecondsLeft(Number(examRow.duration_minutes || 60) * 60); }
      } catch (directError: any) {
        try {
          const res = await fetchExamById(examId, token);
          if (!cancelled) { setExam(res.exam as any); }
          const fallback = await getSupabase().from('exam_questions').select('id,exam_id,question_id,order_index,marks').eq('exam_id', examId).order('order_index');
          if (fallback.error) throw fallback.error;
          const ids = (fallback.data || []).map((x: any) => x.question_id);
          const qs = await getSupabase().from('questions').select('id,question_text,question_type,options,correct_answer,explanation,difficulty,marks').in('id', ids);
          if (qs.error) throw qs.error;
          const byId = new Map((qs.data || []).map((q: any) => [q.id, q]));
          const mapped = (fallback.data || []).map((l: any) => { const q: any = byId.get(l.question_id); return q ? { id: l.id, questionId: q.id, questionText: q.question_text, questionType: q.question_type, options: q.options || [], correctAnswer: q.correct_answer, explanation: q.explanation, difficulty: q.difficulty, marks: Number(l.marks ?? q.marks ?? 1), orderIndex: l.order_index } : null; }).filter(Boolean) as Question[];
          if (!mapped.length) throw new Error('No questions are available for this exam.');
          if (!cancelled) { setQuestions(mapped); setSecondsLeft(Number((res.exam as any).durationMinutes || 60) * 60); }
        } catch (fallbackError: any) { if (!cancelled) setError(fallbackError?.message || directError?.message || 'Failed to load exam questions'); }
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [examId, token]);

  useEffect(() => {
    if (phase !== 'exam' || secondsLeft <= 0) return;
    const timer = window.setInterval(() => setSecondsLeft(v => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [phase, secondsLeft]);

  useEffect(() => { if (phase === 'exam' && secondsLeft === 0 && startedAt && !submitting) submitExam(true); }, [secondsLeft]);

  const answered = useMemo(() => questions.filter(q => answers[q.questionId] !== undefined && answers[q.questionId] !== '').length, [questions, answers]);
  const q = questions[current];
  const setAnswer = (value: any) => q && setAnswers(prev => ({ ...prev, [q.questionId]: value }));
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const start = async () => {
    setStarting(true); setError('');
    try {
      // The backend attempt endpoint is optional; questions are already loaded directly from Supabase.
      try { if (token) await startExamAttempt(examId, token); } catch { /* continue with local attempt */ }
      setStartedAt(Date.now()); setPhase('exam');
    } finally { setStarting(false); }
  };

  async function submitExam(auto = false) {
    if (submitting || !startedAt || !exam) return;
    if (!auto && !window.confirm(`Submit this exam? ${questions.length - answered} question(s) are unanswered.`)) return;
    setSubmitting(true);
    const spent = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
    const details = questions.map(item => {
      const selected = answers[item.questionId];
      const correct = normalizeAnswer(item.correctAnswer);
      const isCorrect = selected !== undefined && String(normalizeAnswer(selected)).trim().toLowerCase() === String(correct).trim().toLowerCase();
      return { questionId: item.questionId, questionText: item.questionText, studentAnswer: selected, correctAnswer: correct, isCorrect, explanation: item.explanation, marks: item.marks };
    });
    const correctCount = details.filter(x => x.isCorrect).length;
    const incorrectCount = details.filter(x => x.studentAnswer !== undefined && !x.isCorrect).length;
    const unansweredCount = details.filter(x => x.studentAnswer === undefined || x.studentAnswer === '').length;
    const totalMarks = details.reduce((sum, x) => sum + Number(x.marks || 1), 0) || questions.length;
    const score = details.reduce((sum, x) => sum + (x.isCorrect ? Number(x.marks || 1) : 0), 0);
    const percentage = Math.round((score / totalMarks) * 100);
    const result = { examTitle: exam.title, score, totalMarks, percentage, isPassed: percentage >= Number(exam.passing_marks || 50), correctCount, incorrectCount, unansweredCount, timeSpent: formatTime(spent), answers: details };
    try {
      if (token) await submitExamAttempt(examId, 'local', { examId, answers: Object.entries(answers).map(([questionId, studentAnswer]) => ({ questionId, studentAnswer })), timeSpentSeconds: spent }, token).catch(() => null);
    } finally {
      window.localStorage.setItem(`exam_result_${examId}`, JSON.stringify(result));
      router.push(`/dashboard/exams/${examId}/results`);
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-9 w-9 animate-spin text-brand-600" /></div>;
  if (error || !exam) return <div className="mx-auto max-w-2xl py-16 text-center"><AlertCircle className="mx-auto h-12 w-12 text-red-500" /><h1 className="mt-4 text-xl font-bold">Unable to load exam</h1><p className="mt-2 text-slate-500">{error || 'Exam not found'}</p><Link href="/dashboard/exams" className="mt-6 inline-flex rounded-xl bg-[#151A3A] px-5 py-2.5 font-semibold text-white">Back to exams</Link></div>;

  if (phase === 'instructions') return <div className="mx-auto max-w-3xl space-y-6"><Link href="/dashboard/exams" className="inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft className="h-4 w-4" />Back to exams</Link><div className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><h1 className="text-3xl font-extrabold text-[#151A3A] dark:text-white">{exam.title}</h1><p className="mt-2 text-slate-500 dark:text-slate-300">{exam.description}</p><div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3"><div className="rounded-xl bg-stone-50 p-4 text-center"><b className="block text-2xl text-[#151A3A]">{questions.length}</b><span className="text-sm text-slate-500">Questions</span></div><div className="rounded-xl bg-stone-50 p-4 text-center"><b className="block text-2xl text-[#151A3A]">{exam.duration_minutes || 60}m</b><span className="text-sm text-slate-500">Duration</span></div><div className="rounded-xl bg-stone-50 p-4 text-center"><b className="block text-2xl text-[#151A3A]">{exam.passing_marks || 50}</b><span className="text-sm text-slate-500">Pass mark</span></div></div>{exam.instructions && <div className="mt-7 rounded-xl bg-brand-50 p-5 text-sm text-slate-700 dark:bg-brand-950/30 dark:text-slate-200"><b>Instructions</b><p className="mt-2 whitespace-pre-wrap">{exam.instructions}</p></div>}<button onClick={start} disabled={starting} className="mt-7 w-full rounded-xl bg-[#151A3A] py-3.5 font-semibold text-white hover:bg-[#202750] disabled:opacity-50">{starting ? 'Preparing questions…' : `Start exam (${questions.length} questions)`}</button></div></div>;

  if (!q) return <div className="p-10 text-center">No question available.</div>;
  const selected = answers[q.questionId];
  const isAnswered = selected !== undefined && selected !== '';
  return <div className="min-h-[calc(100vh-6rem)] space-y-5"><div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#151A3A]/95"><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{exam.title}</span><span className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-sm font-bold ${secondsLeft < 120 ? 'bg-red-100 text-red-700' : 'bg-brand-50 text-brand-800'}`}><Clock3 className="h-4 w-4" />{formatTime(secondsLeft)}</span></div><div className="grid gap-5 lg:grid-cols-[220px_1fr]"><aside className="rounded-xl border border-stone-200 bg-white p-4 dark:border-slate-700 dark:bg-[#1b2045]"><div className="mb-3 text-xs text-slate-500">Answered {answered}/{questions.length}</div><div className="grid grid-cols-5 gap-2">{questions.map((item,i)=><button key={item.questionId} onClick={()=>setCurrent(i)} className={`relative aspect-square rounded-lg text-xs font-semibold ${i===current?'ring-2 ring-brand-600 bg-brand-50 text-brand-800':answers[item.questionId]!==undefined?'bg-emerald-100 text-emerald-700':'bg-stone-100 text-slate-600'}`}>{i+1}{flagged.has(item.questionId)&&<Flag className="absolute right-0.5 top-0.5 h-2.5 w-2.5 text-amber-600"/>}</button>)}</div></aside><main className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 dark:border-slate-700 dark:bg-[#1b2045]"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">Question {current+1} of {questions.length}</span><button onClick={()=>setFlagged(prev=>{const n=new Set(prev);n.has(q.questionId)?n.delete(q.questionId):n.add(q.questionId);return n;})} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${flagged.has(q.questionId)?'bg-amber-100 text-amber-700':'bg-stone-100 text-slate-500'}`}><Flag className="mr-1 inline h-3.5 w-3.5" />{flagged.has(q.questionId)?'Flagged':'Flag'}</button></div><h2 className="mt-6 text-xl font-semibold leading-8 text-[#151A3A] dark:text-white">{q.questionText}</h2><div className="mt-6 space-y-3">{q.options.map((option:any,index:number)=>{const value=option?.id ?? option?.value ?? String.fromCharCode(65+index); const label=optionText(option); return <button key={String(value)} onClick={()=>setAnswer(value)} className={`w-full rounded-xl border p-4 text-left transition ${String(selected)===String(value)?'border-brand-600 bg-brand-50 text-brand-900 dark:bg-brand-950/30 dark:text-brand-200':'border-stone-200 hover:border-brand-300 hover:bg-brand-50/50 dark:border-slate-700 dark:hover:bg-slate-800'}`}><span className="mr-3 font-bold">{String(value)}.</span>{label}</button>})}</div>{q.questionType !== 'mcq' && q.options.length===0 && <textarea value={selected || ''} onChange={e=>setAnswer(e.target.value)} rows={6} className="mt-6 w-full rounded-xl border border-stone-300 p-4" placeholder="Type your answer…"/>}<div className="mt-8 flex items-center justify-between gap-3"><button disabled={current===0} onClick={()=>setCurrent(v=>v-1)} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"><ChevronLeft className="h-4 w-4"/>Previous</button>{current===questions.length-1?<button onClick={()=>submitExam(false)} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-[#151A3A] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submitting?'Submitting…':`Submit${isAnswered?'':' anyway'}`}<CheckCircle2 className="h-4 w-4"/></button>:<button onClick={()=>setCurrent(v=>v+1)} className="inline-flex items-center gap-2 rounded-xl bg-[#151A3A] px-5 py-2.5 text-sm font-semibold text-white">Next<ChevronRight className="h-4 w-4"/></button>}</div></main></div></div>;
}
