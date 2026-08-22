'use client';

import { useEffect, useMemo, useState } from 'react';
import { SearchIcon, BookOpenIcon, ClockIcon, CheckCircleIcon, DownloadIcon, FileTextIcon, ExternalLinkIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const BOARDS = [
  { code: 'waec', name: 'West African Examinations Council' },
  { code: 'jamb', name: 'Joint Admissions and Matriculation Board' },
  { code: 'neco', name: 'National Examination Council' },
  { code: 'nabteb', name: 'National Business and Technical Exams Board' },
] as const;

const YEARS = Array.from({ length: 15 }, (_, i) => 2025 - i);
type TabType = 'papers' | 'questions';

type PastFile = {
  id: string; file_name: string; file_path: string | null; file_size: number | null; mime_type: string | null;
  board: string; subject: string; year: number | null; paper_type: string | null; file_url: string | null;
  public_url: string | null; is_processed: boolean; questions_extracted: number | null;
};

type PastQuestion = {
  id: string; board: string; year: number; subject_id: string | null; question_type: string | null;
  question_text: string; question_image_url: string | null; options: unknown; correct_answer: unknown;
  explanation: string | null; difficulty: string | null; marks: number | null;
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return 'Size unavailable';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeOptions(value: unknown): Array<{ id: string; text: string }> {
  if (Array.isArray(value)) return value.map((item: any, index) => ({ id: String(item?.id ?? item?.label ?? String.fromCharCode(65 + index)), text: String(item?.text ?? item?.value ?? item ?? '') }));
  if (value && typeof value === 'object') return Object.entries(value as Record<string, unknown>).map(([key, item]) => ({ id: key, text: String((item as any)?.text ?? item ?? '') }));
  return [];
}

function normalizeAnswer(value: unknown): string | null {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') {
    const v: any = value;
    return String(v.id ?? v.label ?? v.answer ?? v.value ?? '') || null;
  }
  return null;
}

export default function PastQuestionsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('papers');
  const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [files, setFiles] = useState<PastFile[]>([]);
  const [questions, setQuestions] = useState<PastQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState({ correct: 0, attempted: 0 });

  useEffect(() => {
    if (!selectedBoard) { setFiles([]); setQuestions([]); return; }
    let cancelled = false;
    setLoading(true); setError(null);
    const load = async () => {
      try {
        if (activeTab === 'papers') {
          const { data, error: queryError } = await supabase.from('past_question_files').select('id,file_name,file_path,file_size,mime_type,board,subject,year,paper_type,file_url,public_url,is_processed,questions_extracted').eq('board', selectedBoard).order('year', { ascending: false }).order('subject', { ascending: true });
          if (queryError) throw queryError;
          if (!cancelled) setFiles((data ?? []) as PastFile[]);
        } else {
          const { data, error: queryError } = await supabase.from('past_questions').select('id,board,year,subject_id,question_type,question_text,question_image_url,options,correct_answer,explanation,difficulty,marks').eq('board', selectedBoard).eq('is_active', true).order('year', { ascending: false }).limit(1000);
          if (queryError) throw queryError;
          if (!cancelled) { setQuestions((data ?? []) as PastQuestion[]); setCurrentIndex(0); setSelectedAnswer(null); setShowExplanation(false); setScore({ correct: 0, attempted: 0 }); }
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || `Unable to load ${activeTab === 'papers' ? 'past papers' : 'practice questions'}.`);
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedBoard, activeTab]);

  const subjects = useMemo(() => Array.from(new Set(files.map(f => f.subject).filter(Boolean))).sort(), [files]);
  const filteredFiles = useMemo(() => files.filter(file => {
    if (selectedSubject && file.subject !== selectedSubject) return false;
    if (selectedYear && file.year !== selectedYear) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return file.file_name.toLowerCase().includes(q) || file.subject.toLowerCase().includes(q) || String(file.year ?? '').includes(q);
  }), [files, selectedSubject, selectedYear, searchQuery]);
  const filteredQuestions = useMemo(() => questions.filter(q => {
    if (selectedYear && q.year !== selectedYear) return false;
    if (!searchQuery) return true;
    const needle = searchQuery.toLowerCase();
    return q.question_text.toLowerCase().includes(needle) || String(q.year).includes(needle) || (q.question_type ?? '').toLowerCase().includes(needle);
  }), [questions, selectedYear, searchQuery]);

  const currentQ = filteredQuestions[currentIndex];
  const options = normalizeOptions(currentQ?.options);
  const correctAnswer = normalizeAnswer(currentQ?.correct_answer);

  const handleBoardClick = (code: string) => {
    setSelectedBoard(prev => prev === code ? null : code); setSelectedSubject(null); setSelectedYear(null); setSearchQuery(''); setCurrentIndex(0); setSelectedAnswer(null); setShowExplanation(false);
  };

  const handleAnswer = (id: string) => {
    if (selectedAnswer || !currentQ) return;
    const correct = id === correctAnswer;
    setSelectedAnswer(id); setShowExplanation(true); setScore(prev => ({ attempted: prev.attempted + 1, correct: prev.correct + (correct ? 1 : 0) }));
  };

  const moveQuestion = (direction: number) => {
    setCurrentIndex(i => Math.max(0, Math.min(filteredQuestions.length - 1, i + direction)));
    setSelectedAnswer(null); setShowExplanation(false);
  };

  return (
    <div className="space-y-6">
      <header><h1 className="text-2xl font-bold text-[#151A3A] dark:text-white">Past Questions</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Practice authentic WAEC, JAMB, NECO and NABTEB questions and access available past papers.</p></header>

      <div className="flex w-fit gap-1 rounded-xl bg-stone-100 p-1 dark:bg-slate-800">
        <button onClick={() => setActiveTab('papers')} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'papers' ? 'bg-white text-[#151A3A] shadow-sm dark:bg-[#1b2045] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}><FileTextIcon className="mr-1.5 inline h-4 w-4" />Past Papers</button>
        <button onClick={() => setActiveTab('questions')} className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'questions' ? 'bg-white text-[#151A3A] shadow-sm dark:bg-[#1b2045] dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}><BookOpenIcon className="mr-1.5 inline h-4 w-4" />Practice Questions</button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Select Exam Board</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {BOARDS.map(board => <button key={board.code} onClick={() => handleBoardClick(board.code)} className={`rounded-xl border p-4 text-center transition ${selectedBoard === board.code ? 'border-[#151A3A] bg-[#151A3A] text-white' : 'border-stone-200 bg-stone-50 text-slate-700 hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200 dark:hover:bg-slate-800'}`}><p className="font-bold">{board.code.toUpperCase()}</p><p className={`mt-1 text-xs ${selectedBoard === board.code ? 'text-brand-100' : 'text-slate-500'}`}>{board.name}</p></button>)}
        </div>
      </section>

      {selectedBoard && <>
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
          <div className="relative"><SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentIndex(0); }} placeholder={activeTab === 'papers' ? 'Search papers or subjects...' : 'Search questions...'} className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white" /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeTab === 'papers' && subjects.map(subject => <button key={subject} onClick={() => setSelectedSubject(prev => prev === subject ? null : subject)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selectedSubject === subject ? 'bg-brand-600 text-white' : 'bg-stone-100 text-slate-600 hover:bg-brand-50 dark:bg-slate-800 dark:text-slate-300'}`}>{subject}</button>)}
            {YEARS.map(year => <button key={year} onClick={() => setSelectedYear(prev => prev === year ? null : year)} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selectedYear === year ? 'bg-[#151A3A] text-white' : 'bg-stone-100 text-slate-600 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300'}`}>{year}</button>)}
            <button onClick={() => { setSelectedYear(null); setSelectedSubject(null); setSearchQuery(''); }} className="rounded-lg px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-50 dark:text-brand-300">Clear filters</button>
          </div>
        </section>

        {loading ? <div className="flex items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white py-16 text-slate-500 dark:border-slate-700 dark:bg-[#1b2045]"><ClockIcon className="h-5 w-5 animate-spin" />Loading {activeTab === 'papers' ? 'past papers' : 'questions'}...</div> : activeTab === 'papers' ? (
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]"><p className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{filteredFiles.length} paper{filteredFiles.length === 1 ? '' : 's'} found</p>{filteredFiles.length ? <div className="space-y-2">{filteredFiles.map(file => { const url = file.public_url || file.file_url; return <div key={file.id} className="flex flex-col gap-3 rounded-xl border border-stone-100 p-3 hover:border-brand-200 hover:bg-brand-50/30 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/50"><FileTextIcon className="h-5 w-5 text-brand-700 dark:text-brand-300" /></div><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{file.file_name}</p><p className="mt-0.5 text-xs text-slate-500">{file.subject}{file.year ? ` • ${file.year}` : ''}{file.paper_type ? ` • ${file.paper_type}` : ''} • {formatFileSize(file.file_size)}</p></div></div><div className="flex shrink-0 items-center gap-2">{file.is_processed && <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 dark:bg-green-950/40 dark:text-green-300">{file.questions_extracted ?? 0} Qs</span>}{url ? <><a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-slate-400 hover:bg-brand-50 hover:text-brand-700" title="Open paper"><ExternalLinkIcon className="h-4 w-4" /></a><a href={url} download className="rounded-lg p-2 text-slate-400 hover:bg-green-50 hover:text-green-600" title="Download paper"><DownloadIcon className="h-4 w-4" /></a></> : <span className="text-xs text-slate-400">File unavailable</span>}</div></div>})}</div> : <div className="py-12 text-center text-slate-500"><FileTextIcon className="mx-auto mb-3 h-12 w-12 text-stone-300" /><p>No past papers match your filters.</p></div>}</section>
        ) : (
          <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">{filteredQuestions.length ? <><div className="mb-4 flex items-center justify-between text-sm text-slate-500"><span>Question {currentIndex + 1} of {filteredQuestions.length}</span><span className="font-semibold text-brand-700 dark:text-brand-300">Score {score.correct}/{score.attempted}</span></div><div className="rounded-xl bg-stone-50 p-4 dark:bg-[#151A3A]"><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full bg-brand-100 px-2 py-1 text-xs text-brand-800 dark:bg-brand-950 dark:text-brand-300">{currentQ.year}</span>{currentQ.difficulty && <span className="rounded-full bg-stone-200 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{currentQ.difficulty}</span>}{currentQ.marks != null && <span className="rounded-full bg-stone-200 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{currentQ.marks} mark{currentQ.marks === 1 ? '' : 's'}</span>}</div><p className="font-medium leading-7 text-slate-900 dark:text-white">{currentQ.question_text}</p>{currentQ.question_image_url && <img src={currentQ.question_image_url} alt="Question illustration" className="mt-4 max-h-72 rounded-lg object-contain" />}</div><div className="mt-4 space-y-2">{options.map(opt => <button key={opt.id} onClick={() => handleAnswer(opt.id)} disabled={!!selectedAnswer} className={`w-full rounded-xl border px-4 py-3 text-left transition ${selectedAnswer ? opt.id === correctAnswer ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300' : opt.id === selectedAnswer ? 'border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300' : 'border-stone-200 bg-stone-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800' : 'border-stone-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50/30 dark:border-slate-700 dark:bg-[#151A3A] dark:text-slate-200'}`}><span className="mr-2 font-semibold">{opt.id}.</span>{opt.text}{selectedAnswer && opt.id === correctAnswer && <CheckCircleIcon className="ml-2 inline h-4 w-4 text-green-600" />}</button>)}</div>{showExplanation && currentQ.explanation && <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950/30"><p className="mb-1 font-semibold text-brand-900 dark:text-brand-200">Explanation</p><p className="text-sm leading-6 text-brand-800 dark:text-brand-300">{currentQ.explanation}</p></div>}<div className="mt-5 flex justify-between border-t border-stone-200 pt-4 dark:border-slate-700"><button onClick={() => moveQuestion(-1)} disabled={currentIndex === 0} className="rounded-lg border border-stone-200 px-4 py-2 text-sm disabled:opacity-40 dark:border-slate-700">Previous</button><button onClick={() => moveQuestion(1)} disabled={currentIndex === filteredQuestions.length - 1} className="rounded-lg bg-[#151A3A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">Next</button></div></> : <div className="py-12 text-center text-slate-500"><BookOpenIcon className="mx-auto mb-3 h-12 w-12 text-stone-300" /><p>No practice questions match your filters.</p></div>}</section>
        )}
      </>}

      {!selectedBoard && <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#1b2045]"><FileTextIcon className="mx-auto mb-4 h-16 w-16 text-stone-300" /><h3 className="text-lg font-semibold text-[#151A3A] dark:text-white">Select an exam board</h3><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose WAEC, JAMB, NECO or NABTEB to browse available past papers and practice questions.</p></div>}
    </div>
  );
}
