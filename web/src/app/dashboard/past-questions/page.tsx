'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  BookOpenIcon,
  CheckCircleIcon,
  ClockIcon,
  FlagIcon,
  GraduationCapIcon,
  PlayIcon,
  TrophyIcon,
  XCircleIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { learnerApiConfig, getLearnerApiHeaders, handleApiResponse } from '@/services/api/config';
import { fetchPastQuestionExplanation } from '@/services/api/pastQuestionAnalyticsService';

type Mode = 'class' | 'exam';
type Phase = 'setup' | 'count' | 'exam' | 'results';
type ClassRow = { id: string; name: string; code: string | null };
type SubjectRow = { id: string; name: string; code: string | null };
type Question = {
  id: string;
  question_text: string;
  options: unknown;
  difficulty: string | null;
  question_image_url?: string | null;
  year?: number | null;
  board?: string | null;
  subject_id?: string | null;
  source: 'class' | 'exam';
};
type GradeRow = { question_id: string; is_correct: boolean; correct_answer: unknown; explanation: string | null };
type GradeResult = {
  total: number;
  answered?: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  percentage: number;
  attemptId?: string;
  results: GradeRow[];
};

const EXAMS = [
  { code: 'jamb', label: 'JAMB / UTME', max: 4 },
  { code: 'waec', label: 'WAEC', max: 9 },
  { code: 'neco', label: 'NECO', max: 9 },
  { code: 'nabteb', label: 'NABTEB', max: 9 },
] as const;
const COUNTS = [10, 20, 30, 40, 50];

function optionsOf(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item: any, index) => ({
      id: String(item?.id ?? item?.label ?? String.fromCharCode(65 + index)),
      text: String(item?.text ?? item?.value ?? item ?? ''),
    }));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([id, item]: any) => ({
      id,
      text: String(item?.text ?? item?.value ?? item ?? ''),
    }));
  }
  return [];
}
function scalar(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value && typeof value === 'object') {
    const item: any = value;
    return String(item.id ?? item.label ?? item.answer ?? item.value ?? '') || null;
  }
  return null;
}
function shuffle<T>(rows: T[]) {
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function PastQuestionsPage() {
  const { token } = useAuth();
  const [phase, setPhase] = useState<Phase>('setup');
  const [mode, setMode] = useState<Mode>('exam');
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [examAvailability, setExamAvailability] = useState<Record<string, string[]>>({});
  const [classAvailability, setClassAvailability] = useState<Record<string, string[]>>({});
  const [examYears, setExamYears] = useState<Record<string, number[]>>({});
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('jamb');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classPracticeSessionId, setClassPracticeSessionId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanationOverrides, setExplanationOverrides] = useState<Record<string, string>>({});
  const [explainingQuestionId, setExplainingQuestionId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: classRows, error: classError }, { data: subjectRows, error: subjectError }, { data: courseRows, error: courseError }, availabilityResult] = await Promise.all([
        supabase.from('classes').select('id,name,code').eq('is_active', true).order('order_index'),
        supabase.from('subjects').select('id,name,code').eq('is_active', true).order('order_index'),
        supabase.from('courses').select('class_id,subject_id').eq('status', 'published'),
        fetch(`${learnerApiConfig.baseUrl}/past-question-availability`, {
          headers: getLearnerApiHeaders(token ?? undefined),
          credentials: learnerApiConfig.credentials,
        }).then(handleApiResponse<any>).catch(() => null),
      ]);
      if (classError || subjectError || courseError) setError((classError || subjectError || courseError)?.message || 'Unable to load CBT setup');
      setClasses((classRows || []) as ClassRow[]);
      setSubjects((subjectRows || []) as SubjectRow[]);
      const classSubjects: Record<string, string[]> = {};
      for (const row of courseRows || []) {
        const classId = String((row as any).class_id || '');
        const subjectId = String((row as any).subject_id || '');
        if (!classId || !subjectId) continue;
        const values = classSubjects[classId] || (classSubjects[classId] = []);
        if (!values.includes(subjectId)) values.push(subjectId);
      }
      setClassAvailability(classSubjects);
      const availability = availabilityResult?.data?.availability || {};
      const bySubject: Record<string, string[]> = {};
      const byYear: Record<string, number[]> = {};
      for (const [board, value] of Object.entries(availability) as [string, any][]) {
        bySubject[board] = Array.isArray(value?.subjectIds) ? value.subjectIds : [];
        byYear[board] = Array.isArray(value?.years) ? value.years : [];
      }
      setExamAvailability(bySubject);
      setExamYears(byYear);
    })();
  }, [token]);

  useEffect(() => {
    if (!subjects.length) return;
    const query = new URLSearchParams(window.location.search);
    const board = String(query.get('board') || '').toLowerCase();
    const subject = decodeURIComponent(query.get('subject') || '').trim().toLowerCase();
    if (EXAMS.some(exam => exam.code === board)) {
      setMode('exam');
      setSelectedExam(board);
    }
    if (subject) {
      const match = subjects.find(item => item.name.toLowerCase() === subject || String(item.code || '').toLowerCase() === subject);
      if (match) setSelectedSubjects([match.id]);
    }
  }, [subjects]);

  useEffect(() => {
    if (phase !== 'exam') return;
    const timer = window.setInterval(() => {
      setSecondsLeft(value => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'exam' && secondsLeft === 0 && questions.length > 0 && !submitting) {
      void submitCbt(true);
    }
    // submitCbt intentionally reads the latest component state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, phase]);

  const examConfig = EXAMS.find(item => item.code === selectedExam)!;
  const visibleSubjects = mode === 'exam' && examAvailability[selectedExam]?.length
    ? subjects.filter(subject => examAvailability[selectedExam].includes(subject.id))
    : mode === 'class' && selectedClass
      ? subjects.filter(subject => (classAvailability[selectedClass] || []).includes(subject.id))
      : subjects;
  const availableYears = examYears[selectedExam] || [];
  const selectedNames = selectedSubjects.map(id => subjects.find(subject => subject.id === id)?.name).filter(Boolean) as string[];
  const selectionValid = mode === 'class'
    ? Boolean(selectedClass && selectedSubjects.length === 1)
    : selectedSubjects.length > 0 && (selectedExam !== 'jamb' || selectedSubjects.length === 4);
  const current = questions[index];
  const currentOptions = optionsOf(current?.options);
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const resultMap = useMemo(() => new Map((grade?.results || []).map(row => [row.question_id, row])), [grade]);

  const resetSession = () => {
    setQuestions([]);
    setClassPracticeSessionId(null);
    setAnswers({});
    setFlagged(new Set());
    setIndex(0);
    setSecondsLeft(0);
    setStartedAt(null);
    setGrade(null);
    setExplanationOverrides({});
    setExplainingQuestionId(null);
    setError(null);
  };
  const chooseMode = (value: Mode) => {
    resetSession();
    setPhase('setup');
    setMode(value);
    setSelectedSubjects([]);
    setSelectedYear('');
  };
  const toggleSubject = (id: string) => {
    if (mode === 'class') {
      setSelectedSubjects([id]);
      return;
    }
    setSelectedSubjects(previous => previous.includes(id)
      ? previous.filter(value => value !== id)
      : previous.length < examConfig.max ? [...previous, id] : previous);
  };

  const continueToCount = () => {
    if (!selectionValid) {
      setError(mode === 'exam' && selectedExam === 'jamb'
        ? 'Select exactly 4 JAMB / UTME subjects before continuing.'
        : 'Complete your CBT selection before continuing.');
      return;
    }
    setError(null);
    setPhase('count');
  };

  const loadExamQuestions = async () => {
    const targets = selectedSubjects.map((subjectId, position) => {
      const base = Math.floor(questionCount / selectedSubjects.length);
      const extra = position < questionCount % selectedSubjects.length ? 1 : 0;
      return { subjectId, target: base + extra };
    });
    const groups = await Promise.all(targets.map(async ({ subjectId, target }) => {
      if (target <= 0) return [] as Question[];
      const response = await fetch(`${learnerApiConfig.baseUrl}/past-questions/session`, {
        method: 'POST',
        headers: getLearnerApiHeaders(token ?? undefined),
        credentials: learnerApiConfig.credentials,
        body: JSON.stringify({
          board: selectedExam,
          subjectId,
          count: Math.max(5, target),
          ...(selectedYear ? { year: Number(selectedYear) } : {}),
        }),
      });
      if (response.status === 404) return [] as Question[];
      const payload = await handleApiResponse<any>(response);
      return (payload?.data?.questions || []).slice(0, target).map((question: any) => ({
        id: String(question.id),
        question_text: String(question.question_text || ''),
        options: question.options,
        difficulty: question.difficulty ?? null,
        question_image_url: question.question_image_url ?? null,
        year: question.year ?? null,
        board: question.board ?? selectedExam,
        subject_id: question.subject_id ?? subjectId,
        source: 'exam' as const,
      }));
    }));
    return shuffle(groups.flat());
  };

  async function startCbt() {
    if (!token || !selectionValid || loading) return;
    setLoading(true);
    setError(null);
    try {
      let loaded: Question[] = [];
      if (mode === 'class') {
        const response = await fetch(`${learnerApiConfig.baseUrl}/class-practice/session`, {
          method: 'POST',
          headers: getLearnerApiHeaders(token),
          credentials: learnerApiConfig.credentials,
          body: JSON.stringify({
            classId: selectedClass,
            subjectId: selectedSubjects[0],
            count: questionCount,
          }),
        });
        const payload = await handleApiResponse<any>(response);
        setClassPracticeSessionId(String(payload.data?.sessionId || ''));
        loaded = (payload.data?.questions || []).map((question: any) => ({
          id: String(question.id),
          question_text: String(question.question_text || ''),
          options: question.options,
          difficulty: question.difficulty ?? null,
          subject_id: selectedSubjects[0],
          source: 'class' as const,
        }));
      } else {
        loaded = await loadExamQuestions();
      }
      if (!loaded.length) throw new Error('No graded questions are available for this selection yet.');
      setQuestions(loaded);
      setAnswers({});
      setFlagged(new Set());
      setIndex(0);
      setGrade(null);
      setSecondsLeft(loaded.length * 60);
      setStartedAt(Date.now());
      setPhase('exam');
    } catch (err: any) {
      setError(err?.message || 'Unable to start this CBT');
    } finally {
      setLoading(false);
    }
  }

  async function explainPastQuestion(questionId: string) {
    if (!token || mode !== 'exam' || explainingQuestionId) return;
    setExplainingQuestionId(questionId);
    setError(null);
    try {
      const result = await fetchPastQuestionExplanation(questionId, token);
      setExplanationOverrides(previous => ({ ...previous, [questionId]: result.explanation }));
    } catch (err: any) {
      setError(err?.message || 'Unable to generate this explanation');
    } finally {
      setExplainingQuestionId(null);
    }
  }

  async function submitCbt(automatic = false) {
    if (!token || !questions.length || submitting) return;
    if (!automatic && !window.confirm(`Submit this CBT? ${questions.length - answeredCount} question(s) are unanswered.`)) return;
    setSubmitting(true);
    setError(null);
    try {
      let result: GradeResult;
      if (mode === 'class') {
        if (!classPracticeSessionId) throw new Error('Class practice session is missing. Please start a new set.');
        const response = await fetch(`${learnerApiConfig.baseUrl}/class-practice/${classPracticeSessionId}/grade`, {
          method: 'POST',
          headers: getLearnerApiHeaders(token),
          credentials: learnerApiConfig.credentials,
          body: JSON.stringify({
            answers: questions.map(question => ({ questionId: question.id, answer: answers[question.id] || '' })),
          }),
        });
        const payload = await handleApiResponse<any>(response);
        result = payload.data.result as GradeResult;
      } else {
        const response = await fetch(`${learnerApiConfig.baseUrl}/past-questions/grade`, {
          method: 'POST',
          headers: getLearnerApiHeaders(token),
          credentials: learnerApiConfig.credentials,
          body: JSON.stringify({
            board: selectedExam,
            ...(selectedYear ? { year: Number(selectedYear) } : {}),
            timeSpentSeconds: startedAt ? Math.max(0, Math.round((Date.now() - startedAt) / 1000)) : 0,
            answers: questions.map(question => ({ questionId: question.id, answer: answers[question.id] || '' })),
          }),
        });
        const payload = await handleApiResponse<any>(response);
        result = payload.data.result as GradeResult;
      }
      setGrade(result);
      setPhase('results');
    } catch (err: any) {
      setError(err?.message || 'Unable to submit this CBT');
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === 'setup') {
    return <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-bold text-[#151A3A] dark:text-white">Past Questions CBT</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Choose the exam source and subjects first. Question count comes on the next screen.</p></div><div className="flex flex-wrap gap-2"><Link href="/dashboard/past-questions/analytics" className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"><BarChart3 className="h-4 w-4"/>Performance</Link><Link href="/dashboard/past-questions/library" className="inline-flex items-center justify-center rounded-xl border border-[#151A3A] px-4 py-2 text-sm font-semibold text-[#151A3A] transition hover:bg-[#151A3A] hover:text-white dark:border-slate-300 dark:text-slate-100">Browse extracted question bank</Link></div></header>
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
      <div className="flex w-fit gap-1 rounded-xl bg-stone-100 p-1 dark:bg-slate-800">
        <button onClick={() => chooseMode('class')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'class' ? 'bg-white text-[#151A3A] shadow-sm dark:bg-[#1b2045] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}><GraduationCapIcon className="mr-1.5 inline h-4 w-4"/>Class Practice</button>
        <button onClick={() => chooseMode('exam')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'exam' ? 'bg-white text-[#151A3A] shadow-sm dark:bg-[#1b2045] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}><BookOpenIcon className="mr-1.5 inline h-4 w-4"/>JAMB / WAEC / NECO / NABTEB</button>
      </div>
      <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        {mode === 'class' ? <>
          <p className="mb-3 text-sm font-semibold">1. Choose class</p>
          <div className="flex flex-wrap gap-2">{classes.map(item => <button key={item.id} onClick={() => { setSelectedClass(item.id); setSelectedSubjects([]); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${selectedClass === item.id ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}>{item.name}</button>)}</div>
        </> : <>
          <p className="mb-3 text-sm font-semibold">1. Choose examination</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">{EXAMS.map(item => <button key={item.code} onClick={() => { setSelectedExam(item.code); setSelectedSubjects([]); setSelectedYear(''); }} className={`rounded-xl border p-3 text-sm font-bold ${selectedExam === item.code ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}>{item.label}</button>)}</div>
        </>}
        {(mode === 'exam' || selectedClass) && <div className="mt-6">
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold">2. {mode === 'exam' ? `Select subjects (up to ${examConfig.max})` : 'Select subject'}</p><span className="text-xs font-bold text-slate-500">{selectedSubjects.length} selected</span></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{visibleSubjects.map(subject => {
            const selected = selectedSubjects.includes(subject.id);
            const disabled = mode === 'exam' && !selected && selectedSubjects.length >= examConfig.max;
            return <button key={subject.id} disabled={disabled} onClick={() => toggleSubject(subject.id)} className={`rounded-xl border p-3 text-left text-sm font-semibold transition ${selected ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 text-slate-700 hover:border-[#151A3A]/40 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'} disabled:cursor-not-allowed disabled:opacity-40`}><span className="mr-2">{selected ? '✓' : '○'}</span>{subject.name}</button>;
          })}</div>
          {mode === 'exam' && selectedExam === 'jamb' && <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300">JAMB / UTME combined CBT requires exactly 4 subjects.</p>}
          {mode === 'exam' && selectedSubjects.length > 0 && availableYears.length > 0 && <label className="mt-5 block text-sm font-medium">3. Year (optional)<select value={selectedYear} onChange={event => setSelectedYear(event.target.value)} className="ml-2 rounded-lg border border-stone-200 bg-stone-50 p-2 text-sm dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value="">All available years</option>{availableYears.map(year => <option key={year} value={year}>{year}</option>)}</select></label>}
        </div>}
        <button onClick={continueToCount} disabled={!selectionValid} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#151A3A] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Continue to question count <PlayIcon className="h-4 w-4"/></button>
      </section>
      <p className="text-xs text-slate-500">JAMB and WAEC questions are served from the extracted Supabase question bank; source PDFs are not exposed to learners.</p>
    </div>;
  }

  if (phase === 'count') {
    return <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={() => { setError(null); setPhase('setup'); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"><ArrowLeft className="h-4 w-4"/>Back to selection</button>
      <section className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-700">CBT setup</p>
        <h1 className="mt-2 text-3xl font-extrabold text-[#151A3A] dark:text-white">Choose question count</h1>
        <p className="mt-2 text-slate-500">{mode === 'exam' ? selectedExam.toUpperCase() : classes.find(item => item.id === selectedClass)?.name} · {selectedNames.join(' • ')}{selectedYear ? ` · ${selectedYear}` : ''}</p>
        {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-5">{COUNTS.map(count => <button key={count} onClick={() => setQuestionCount(count)} className={`rounded-xl border p-4 text-center font-bold transition ${questionCount === count ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 text-slate-700 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white'}`}>{count}<span className="mt-1 block text-xs font-normal opacity-70">questions</span></button>)}</div>
        <div className="mt-6 rounded-xl bg-brand-50 p-4 text-sm text-slate-700 dark:bg-brand-950/30 dark:text-slate-200"><b>Timing:</b> 1 minute per loaded question. Answers are graded only when you submit.</div>
        <button onClick={() => void startCbt()} disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#151A3A] py-3.5 font-semibold text-white disabled:opacity-50">{loading ? <><ClockIcon className="h-4 w-4 animate-spin"/>Loading questions…</> : <><PlayIcon className="h-4 w-4"/>Start CBT</>}</button>
      </section>
    </div>;
  }

  if (phase === 'results' && grade) {
    return <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-br from-[#151A3A] to-[#30406f] p-7 text-white shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center"><div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white/15 text-3xl font-extrabold">{Number(grade.percentage || 0)}%</div><div><TrophyIcon className="h-8 w-8 text-amber-300"/><h1 className="mt-2 text-2xl font-extrabold">CBT Results</h1><p className="mt-1 text-slate-200">{selectedNames.join(' • ')}</p><div className="mt-4 flex flex-wrap gap-5 text-sm"><span><b className="text-xl">{grade.correct}</b> correct</span><span><b className="text-xl">{grade.incorrect}</b> wrong</span><span><b className="text-xl">{grade.unanswered}</b> skipped</span></div></div></div>
      </section>
      <div className="flex flex-wrap gap-3"><button onClick={() => { resetSession(); setPhase('count'); }} className="rounded-xl bg-[#151A3A] px-5 py-3 font-semibold text-white">Try another set</button><button onClick={() => { resetSession(); setPhase('setup'); }} className="rounded-xl border border-stone-300 px-5 py-3 font-semibold">Change selection</button>{mode === 'exam' && <Link href="/dashboard/past-questions/analytics" className="inline-flex items-center gap-2 rounded-xl border border-brand-200 px-5 py-3 font-semibold text-brand-700"><BarChart3 className="h-4 w-4"/>View performance</Link>}</div>
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><h2 className="text-xl font-bold text-[#151A3A] dark:text-white">Answer review</h2><div className="mt-5 space-y-4">{questions.map((question, position) => {
        const row = resultMap.get(question.id);
        const correctAnswer = scalar(row?.correct_answer);
        return <article key={question.id} className="rounded-xl border border-stone-200 p-4 dark:border-slate-700"><div className="flex gap-3">{row?.is_correct ? <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"/> : <XCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-600"/>}<div><p className="font-semibold">{position + 1}. {question.question_text}</p><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Your answer: <b>{answers[question.id] || 'Not answered'}</b></p>{!row?.is_correct && <p className="mt-1 text-sm text-emerald-700">Correct answer: <b>{correctAnswer || '—'}</b></p>}{(explanationOverrides[question.id] || row?.explanation) ? <div className="mt-2 rounded-lg bg-brand-50 p-3 text-sm dark:bg-brand-950/30"><b>Explanation:</b> {explanationOverrides[question.id] || row?.explanation}</div> : mode === 'exam' && <button type="button" onClick={() => void explainPastQuestion(question.id)} disabled={explainingQuestionId === question.id} className="mt-3 rounded-lg border border-brand-200 px-3 py-2 text-xs font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50">{explainingQuestionId === question.id ? 'Explaining…' : 'Explain this answer'}</button>}</div></div></article>;
      })}</div></section>
    </div>;
  }

  if (!current) return <div className="py-16 text-center text-slate-500">No question available.</div>;

  return <div className="space-y-5">
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="sticky top-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#1b2045]/95"><div><b className="text-[#151A3A] dark:text-white">{mode === 'exam' ? selectedExam.toUpperCase() : 'Class'} CBT</b><p className="text-xs text-slate-500">Answered {answeredCount}/{questions.length} · {selectedNames.join(' • ')}</p></div><div className="rounded-xl bg-brand-50 px-4 py-2 font-mono text-lg font-bold text-[#151A3A] dark:bg-brand-950/30 dark:text-white">{formatTime(secondsLeft)}</div></div>
    <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
      <aside className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><p className="font-semibold">Questions</p><div className="mt-3 grid grid-cols-5 gap-2">{questions.map((question, position) => <button key={question.id} onClick={() => setIndex(position)} className={`rounded-lg border p-2 text-xs font-semibold ${position === index ? 'border-[#151A3A] bg-[#151A3A] text-white' : answers[question.id] ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-white dark:border-slate-700 dark:bg-[#151A3A]'}`}>{position + 1}{flagged.has(question.id) ? '⚑' : ''}</button>)}</div></aside>
      <main className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="flex items-center justify-between gap-3"><span className="text-sm text-slate-500">Question {index + 1} of {questions.length}</span><button onClick={() => setFlagged(previous => { const next = new Set(previous); next.has(current.id) ? next.delete(current.id) : next.add(current.id); return next; })} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold"><FlagIcon className="h-3.5 w-3.5"/>{flagged.has(current.id) ? 'Flagged' : 'Flag'}</button></div>
        <div className="mt-5 rounded-xl bg-stone-50 p-5 dark:bg-[#151A3A]"><div className="mb-2 flex gap-2">{current.year && <span className="rounded-full bg-brand-100 px-2 py-1 text-xs">{current.year}</span>}{current.difficulty && <span className="rounded-full bg-stone-200 px-2 py-1 text-xs dark:bg-slate-700">{current.difficulty}</span>}</div><p className="font-semibold leading-7 text-slate-900 dark:text-white">{current.question_text}</p>{current.question_image_url && <img src={current.question_image_url} alt="Question illustration" className="mt-4 max-h-72 rounded-lg object-contain"/>}</div>
        <div className="mt-4 space-y-2">{currentOptions.map(option => <button key={option.id} onClick={() => setAnswers(previous => ({ ...previous, [current.id]: option.id }))} className={`w-full rounded-xl border px-4 py-3 text-left transition ${answers[current.id] === option.id ? 'border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-950/30 dark:text-brand-100' : 'border-stone-200 bg-white text-slate-700 hover:border-brand-300 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}><span className="mr-2 font-bold">{option.id}.</span>{option.text}</button>)}</div>
        <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-stone-200 pt-4 dark:border-slate-700"><button onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Previous</button><div className="flex gap-2"><button onClick={() => setIndex(value => Math.min(questions.length - 1, value + 1))} disabled={index === questions.length - 1} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40">Next</button><button onClick={() => void submitCbt(false)} disabled={submitting} className="rounded-lg bg-[#151A3A] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit CBT'}</button></div></div>
      </main>
    </div>
  </div>;
}
