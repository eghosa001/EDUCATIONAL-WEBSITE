'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock3, Trophy, XCircle } from 'lucide-react';

export default function ExamResultsPage() {
  const params = useParams();
  const examId = String(params?.examId || '');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(`exam_result_${examId}`);
      if (!stored) {
        setResult(null);
        return;
      }
      try {
        setResult(JSON.parse(stored));
      } catch (error) {
        console.error('Invalid stored exam result; clearing it:', error);
        window.localStorage.removeItem(`exam_result_${examId}`);
        setResult(null);
      }
    } catch (error) {
      console.error('Unable to read exam result:', error);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" /></div>;
  if (!result) return <div className="mx-auto max-w-xl py-16 text-center"><Trophy className="mx-auto h-14 w-14 text-slate-300" /><h1 className="mt-4 text-xl font-bold text-[#151A3A]">No result found</h1><p className="mt-2 text-slate-500">Take the exam first to see your result.</p><Link href={`/dashboard/exams/${examId}`} className="mt-6 inline-flex rounded-xl bg-[#151A3A] px-5 py-2.5 font-semibold text-white">Go to exam</Link></div>;

  const answers = Array.isArray(result.answers) ? result.answers : [];
  const passed = Boolean(result.isPassed ?? Number(result.percentage) >= 50);
  const percentage = Math.max(0, Math.min(100, Number(result.percentage) || 0));

  return <div className="space-y-6"><Link href={`/dashboard/exams/${examId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-700"><ArrowLeft className="h-4 w-4"/>Back to exam</Link><section className={`rounded-2xl p-7 text-white shadow-sm ${passed ? 'bg-gradient-to-br from-[#151A3A] to-[#30406f]' : 'bg-gradient-to-br from-[#151A3A] to-[#6b3940]'}`}><div className="flex flex-col gap-6 sm:flex-row sm:items-center"><div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/15 text-4xl font-extrabold">{percentage}%</div><div className="flex-1"><h1 className="text-2xl font-extrabold">{result.examTitle || 'Exam Results'}</h1><p className="mt-1 font-semibold">{passed ? 'Passed' : 'Needs more practice'}</p><p className="mt-2 flex items-center gap-2 text-sm opacity-80"><Clock3 className="h-4 w-4"/>Time spent: {result.timeSpent || '—'}</p><div className="mt-5 grid grid-cols-3 gap-4 text-sm"><div><b className="block text-2xl">{result.correctCount || 0}</b>Correct</div><div><b className="block text-2xl">{result.incorrectCount || 0}</b>Wrong</div><div><b className="block text-2xl">{result.unansweredCount || 0}</b>Skipped</div></div></div></div></section>{answers.length > 0 && <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><h2 className="text-xl font-bold text-[#151A3A] dark:text-white">Answer review</h2><div className="mt-5 space-y-4">{answers.map((answer:any,index:number)=><article key={answer.questionId || index} className="rounded-xl border border-stone-200 p-4 dark:border-slate-700"><div className="flex gap-3"><div className={`mt-0.5 shrink-0 ${answer.isCorrect?'text-emerald-600':'text-red-600'}`}>{answer.isCorrect?<CheckCircle2 className="h-5 w-5"/>:<XCircle className="h-5 w-5"/>}</div><div className="min-w-0 flex-1"><p className="font-semibold text-slate-900 dark:text-white">{index+1}. {answer.questionText || 'Question'}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your answer: <b>{answer.studentAnswer === undefined ? 'Not answered' : String(answer.studentAnswer)}</b></p>{!answer.isCorrect && <p className="mt-1 text-sm text-emerald-700">Correct answer: <b>{String(answer.correctAnswer ?? '—')}</b></p>}{answer.explanation && <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-slate-700 dark:bg-brand-950/30 dark:text-slate-200"><b>Explanation:</b> {answer.explanation}</div>}</div></div></article>)}</div></section>}</div>;
}
