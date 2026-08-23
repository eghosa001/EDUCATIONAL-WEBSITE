'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpenIcon, CheckCircleIcon, ClockIcon, GraduationCapIcon, SearchIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'class' | 'exam';
type ClassRow = { id: string; name: string; code: string | null };
type SubjectRow = { id: string; name: string; code: string | null };
type Question = { id: string; question_text: string; options: unknown; correct_answer: unknown; explanation: string | null; difficulty: string | null; marks: number | null; question_image_url: string | null; year?: number | null; exam_name?: string | null };
const EXAMS = [{ code: 'jamb', label: 'JAMB' }, { code: 'waec', label: 'WAEC' }, { code: 'neco', label: 'NECO' }, { code: 'nabteb', label: 'NABTEB' }] as const;
const YEARS = Array.from({ length: 15 }, (_, i) => 2025 - i);

function normalizeOptions(value: unknown): Array<{ id: string; text: string }> {
  if (Array.isArray(value)) return value.map((item: any, i) => ({ id: String(item?.id ?? item?.label ?? String.fromCharCode(65 + i)), text: String(item?.text ?? item?.value ?? item ?? '') }));
  if (value && typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([id, item]: any) => ({ id, text: String(item?.text ?? item?.value ?? item ?? '') }));
  return [];
}
function normalizeAnswer(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') { const v: any = value; return String(v.id ?? v.label ?? v.answer ?? v.value ?? '') || null; }
  return null;
}

export default function PastQuestionsPage() {
  const [mode, setMode] = useState<Mode>('exam');
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExam, setSelectedExam] = useState('jamb');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, attempted: 0 });

  useEffect(() => {
    const loadFilters = async () => {
      const [{ data: classData, error: classError }, { data: subjectData, error: subjectError }] = await Promise.all([
        supabase.from('classes').select('id,name,code').eq('is_active', true).order('order_index'),
        supabase.from('subjects').select('id,name,code').eq('is_active', true).order('order_index'),
      ]);
      if (classError || subjectError) setError((classError || subjectError)?.message ?? 'Unable to load question-bank filters.');
      setClasses((classData ?? []) as ClassRow[]); setSubjects((subjectData ?? []) as SubjectRow[]);
    };
    loadFilters();
  }, []);

  useEffect(() => {
    setQuestions([]); setIndex(0); setAnswer(null); setShowExplanation(false); setScore({ correct: 0, attempted: 0 });
    if (mode === 'class' && (!selectedClass || !selectedSubject)) return;
    if (mode === 'exam' && (!selectedExam || !selectedSubject)) return;
    let cancelled = false;
    const loadQuestions = async () => {
      setLoading(true); setError(null);
      try {
        if (mode === 'class') {
          const { data, error: qError } = await supabase.from('questions').select('id,question_text,options,correct_answer,explanation,difficulty,marks,question_image_url,exam_name,exam_year').eq('class_id', selectedClass).eq('subject_id', selectedSubject).eq('is_active', true).order('created_at', { ascending: true }).limit(1000);
          if (qError) throw qError;
          if (!cancelled) setQuestions((data ?? []) as Question[]);
        } else {
          let query = supabase.from('past_questions').select('id,question_text,options,correct_answer,explanation,difficulty,marks,question_image_url,year,board').eq('board', selectedExam).eq('subject_id', selectedSubject).eq('is_active', true).order('year', { ascending: false }).limit(1000);
          if (selectedYear) query = query.eq('year', Number(selectedYear));
          const { data, error: qError } = await query;
          if (qError) throw qError;
          if (!cancelled) setQuestions((data ?? []) as Question[]);
        }
      } catch (e: any) { if (!cancelled) setError(e?.message || 'Unable to load this question bank.'); }
      finally { if (!cancelled) setLoading(false); }
    };
    loadQuestions();
    return () => { cancelled = true; };
  }, [mode, selectedClass, selectedExam, selectedSubject, selectedYear]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(item => item.question_text.toLowerCase().includes(q) || String(item.year ?? '').includes(q) || String(item.exam_name ?? '').toLowerCase().includes(q));
  }, [questions, search]);
  useEffect(() => { setIndex(0); setAnswer(null); setShowExplanation(false); }, [search]);
  const current = filtered[index];
  const options = normalizeOptions(current?.options);
  const correct = normalizeAnswer(current?.correct_answer);
  const subjectName = subjects.find(s => s.id === selectedSubject)?.name;
  const className = classes.find(c => c.id === selectedClass)?.name;
  const selectAnswer = (id: string) => { if (answer || !current) return; const isCorrect = id === correct; setAnswer(id); setShowExplanation(true); setScore(s => ({ attempted: s.attempted + 1, correct: s.correct + (isCorrect ? 1 : 0) })); };
  const next = () => { setIndex(i => Math.min(i + 1, filtered.length - 1)); setAnswer(null); setShowExplanation(false); };
  const previous = () => { setIndex(i => Math.max(i - 1, 0)); setAnswer(null); setShowExplanation(false); };

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-[#151A3A] dark:text-white">Question Banks</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Every subject has its own CBT question bank. School questions are separated by class; JAMB, WAEC, NECO and NABTEB are separate exam banks.</p></header>
    <div className="flex w-fit gap-1 rounded-xl bg-stone-100 p-1 dark:bg-slate-800">
      <button onClick={() => { setMode('class'); setSelectedSubject(''); setSelectedClass(''); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'class' ? 'bg-white text-[#151A3A] shadow-sm dark:bg-[#1b2045] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}><GraduationCapIcon className="mr-1.5 inline h-4 w-4" />Class Question Bank</button>
      <button onClick={() => { setMode('exam'); setSelectedSubject(''); setSelectedYear(''); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode === 'exam' ? 'bg-white text-[#151A3A] shadow-sm dark:bg-[#1b2045] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}><BookOpenIcon className="mr-1.5 inline h-4 w-4" />Exam Question Banks</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
      {mode === 'class' ? <><p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Choose your class</p><div className="flex flex-wrap gap-2">{classes.map(c => <button key={c.id} onClick={() => { setSelectedClass(c.id); setSelectedSubject(''); }} className={`rounded-xl border px-4 py-2 text-sm font-semibold ${selectedClass === c.id ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 text-slate-700 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}>{c.name}</button>)}</div></> : <><p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Choose an exam</p><div className="grid grid-cols-2 gap-2 md:grid-cols-4">{EXAMS.map(e => <button key={e.code} onClick={() => { setSelectedExam(e.code); setSelectedSubject(''); }} className={`rounded-xl border p-3 text-sm font-bold ${selectedExam === e.code ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 text-slate-700 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}>{e.label}</button>)}</div></>}
      {(mode === 'class' ? !!selectedClass : !!selectedExam) && <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Subject<select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value="">Select subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        {mode === 'exam' && <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Year (optional)<select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value="">All available years</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select></label>}
      </div>}
    </section>
    {selectedSubject && <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold text-[#151A3A] dark:text-white">{subjectName} Question Bank</h2><p className="text-sm text-slate-500">{mode === 'class' ? className : selectedExam.toUpperCase()}{selectedYear ? ` • ${selectedYear}` : ''} • {questions.length} questions</p></div><div className="relative md:w-72"><SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search this bank" className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-[#151A3A] dark:text-white" /></div></div>
      {loading ? <div className="flex items-center justify-center gap-2 py-16 text-slate-500"><ClockIcon className="h-5 w-5 animate-spin" />Loading question bank...</div> : filtered.length === 0 ? <div className="py-16 text-center text-slate-500"><BookOpenIcon className="mx-auto mb-3 h-12 w-12 text-stone-300" /><p>No CBT questions are available for this subject yet.</p></div> : <>
        <div className="mb-4 flex items-center justify-between text-sm text-slate-500"><span>Question {index + 1} of {filtered.length}</span><span className="font-semibold text-brand-700 dark:text-brand-300">Score {score.correct}/{score.attempted}</span></div>
        <div className="rounded-xl bg-stone-50 p-5 dark:bg-[#151A3A]"><div className="mb-3 flex flex-wrap gap-2">{current?.year && <span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-800 dark:bg-brand-950 dark:text-brand-300">{current.year}</span>}{current?.difficulty && <span className="rounded-full bg-stone-200 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{current.difficulty}</span>}</div><p className="font-medium leading-7 text-slate-900 dark:text-white">{current?.question_text}</p>{current?.question_image_url && <img src={current.question_image_url} alt="Question illustration" className="mt-4 max-h-72 rounded-lg object-contain" />}</div>
        <div className="mt-4 space-y-2">{options.map(opt => <button key={opt.id} onClick={() => selectAnswer(opt.id)} disabled={!!answer} className={`w-full rounded-xl border px-4 py-3 text-left transition ${answer ? opt.id === correct ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' : opt.id === answer ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300' : 'border-stone-200 bg-stone-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800' : 'border-stone-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/30 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}><span className="mr-2 font-bold">{opt.id}.</span>{opt.text}{answer && opt.id === correct && <CheckCircleIcon className="ml-2 inline h-4 w-4 text-green-600" />}</button>)}</div>
        {showExplanation && current?.explanation && <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/30"><p className="font-semibold text-brand-900 dark:text-brand-200">Explanation</p><p className="mt-1 text-sm leading-6 text-brand-800 dark:text-brand-300">{current.explanation}</p></div>}
        <div className="mt-5 flex justify-between border-t border-stone-200 pt-4 dark:border-slate-700"><button onClick={previous} disabled={index === 0} className="rounded-lg border border-stone-200 px-4 py-2 text-sm disabled:opacity-40 dark:border-slate-700">Previous</button><button onClick={next} disabled={index === filtered.length - 1} className="rounded-lg bg-[#151A3A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Next</button></div>
      </>}
    </section>}
    {!selectedSubject && <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#1b2045]"><BookOpenIcon className="mx-auto mb-3 h-14 w-14 text-stone-300" /><h3 className="font-semibold text-[#151A3A] dark:text-white">Choose a subject to open its CBT question bank</h3><p className="mt-2 text-sm text-slate-500">PDFs are not used as the student exam interface. Exam questions are stored individually and delivered as interactive CBT questions.</p></div>}
  </div>;
}
