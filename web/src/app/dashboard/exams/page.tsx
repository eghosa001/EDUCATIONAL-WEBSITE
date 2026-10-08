'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenCheck, Clock3, GraduationCap, Loader2, School, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchExamBoardAvailability, type ExamBoardAvailabilityMap } from '@/services/api/examBoardService';
import { learnerApiConfig, getLearnerApiHeaders, handleApiResponse } from '@/services/api/config';

async function fetchVerifiedAvailability(token?: string | null): Promise<ExamBoardAvailabilityMap> {
  const response = await fetch(`${learnerApiConfig.baseUrl}/verified-practice-availability`, {
    headers: getLearnerApiHeaders(token ?? undefined),
    credentials: learnerApiConfig.credentials,
  });
  const payload = await handleApiResponse<any>(response);
  return payload?.data?.availability || {};
}

const SCHOOL_BOARDS = [
  { code: 'waec', title: 'WAEC', subtitle: 'West African Senior School Certificate Examination', description: 'Practise verified WAEC questions by subject and available year, or run a timed CBT session.' },
  { code: 'neco', title: 'NECO', subtitle: 'National Examinations Council', description: 'Work through NECO questions in a clean subject-by-subject practice or timed exam flow.' },
  { code: 'nabteb', title: 'NABTEB', subtitle: 'National Business and Technical Examinations Board', description: 'Use the available NABTEB question bank for revision and timed CBT practice.' },
] as const;

const examJourney = [
  { title: 'Select board', copy: 'Start with WAEC, NECO or NABTEB. JAMB stays in its own centre.' },
  { title: 'Select subject', copy: 'Choose the exact subject before any question is loaded.' },
  { title: 'Choose question count', copy: 'Run a short daily set or a longer CBT session.' },
  { title: 'Submit and review', copy: 'See score, corrections and weak topics after practice.' },
];

export default function ExamsPage() {
  const { token } = useAuth();
  const [availability, setAvailability] = useState<ExamBoardAvailabilityMap>({});
  const [verifiedAvailability, setVerifiedAvailability] = useState<ExamBoardAvailabilityMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    void Promise.all([fetchExamBoardAvailability(token), fetchVerifiedAvailability(token)])
      .then(([historical, verified]) => {
        if (!cancelled) {
          setAvailability(historical);
          setVerifiedAvailability(verified);
        }
      })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load exam availability'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  return <div className="space-y-7">
    <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-[#1b2045] dark:ring-slate-700 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">School examinations</p>
          <h1 className="mt-1 text-3xl font-extrabold text-[#151A3A] dark:text-white">WAEC, NECO & NABTEB</h1>
          <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-400">No board mixing: each school exam keeps its own subject path, practice source and CBT entry point.</p>
        </div>
        <Link href="/dashboard/jamb" className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200">
          <GraduationCap className="h-4 w-4" /> Go to JAMB
        </Link>
      </div>
    </header>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-6">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">Exam journey</p>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        {examJourney.map((step, index) => <div key={step.title} className="rounded-2xl bg-stone-50 p-4 dark:bg-[#151A3A]"><span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">0{index + 1}</span><h2 className="mt-3 font-extrabold text-[#151A3A] dark:text-white">{step.title}</h2><p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{step.copy}</p></div>)}
      </div>
    </section>

    <section className="grid gap-5 lg:grid-cols-3">
      {SCHOOL_BOARDS.map((board) => {
        const data = availability[board.code];
        const verified = verifiedAvailability[board.code];
        const ready = Number(data?.questionCount || 0) > 0;
        const verifiedReady = Number(verified?.questionCount || 0) > 0;
        return <article key={board.code} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#151A3A] text-white"><School className="h-6 w-6" /></div>
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> : <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${verifiedReady ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{verifiedReady ? 'Verified practice ready' : 'Practice bank pending'}</span>}
          </div>
          <h2 className="mt-5 text-2xl font-extrabold text-[#151A3A] dark:text-white">{board.title}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-400">{board.subtitle}</p>
          <p className="mt-3 min-h-[66px] text-sm leading-6 text-slate-600 dark:text-slate-300">{verifiedReady ? `THE GUIDE has original ${board.title}-aligned questions built from verified online sources. ${ready ? 'A separate historical past-question archive is also available.' : 'Historical past questions will remain separate until genuine source papers are verified.'}` : board.description}</p>
          <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-stone-50 p-3 text-center dark:bg-[#151A3A]"><div><b className="block text-lg text-[#151A3A] dark:text-white">{loading ? '—' : verified?.questionCount ?? 0}</b><span className="text-[11px] text-slate-500">verified</span></div><div><b className="block text-lg text-[#151A3A] dark:text-white">{loading ? '—' : verified?.subjectIds?.length ?? 0}</b><span className="text-[11px] text-slate-500">subjects</span></div><div><b className="block text-lg text-[#151A3A] dark:text-white">{loading ? '—' : data?.questionCount ?? 0}</b><span className="text-[11px] text-slate-500">archive</span></div></div>
          <div className="mt-5 grid gap-2">
            {verifiedReady && <><Link href={`/dashboard/past-questions?board=${board.code}&experience=verified-practice`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#151A3A] px-4 py-3 text-sm font-bold text-white hover:bg-[#202852]"><Sparkles className="h-4 w-4" /> Verified Practice</Link><Link href={`/dashboard/past-questions?board=${board.code}&experience=verified-cbt`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-bold text-brand-800 hover:bg-brand-100 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200"><Clock3 className="h-4 w-4" /> Verified Practice CBT</Link></>}
            {ready ? <><Link href={`/dashboard/past-questions?board=${board.code}&experience=school-past`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm font-bold text-[#151A3A] hover:border-brand-300 hover:bg-brand-50 dark:border-slate-700 dark:text-white"><BookOpenCheck className="h-4 w-4" /> Past Questions</Link><Link href={`/dashboard/past-questions?board=${board.code}&experience=school-cbt`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#151A3A] px-4 py-3 text-sm font-bold text-white hover:bg-[#202852]"><Clock3 className="h-4 w-4" /> Timed CBT</Link></> : <><span aria-disabled="true" className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800/40"><BookOpenCheck className="h-4 w-4" /> Past Questions unavailable</span><span aria-disabled="true" className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-300 px-4 py-3 text-sm font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400"><Clock3 className="h-4 w-4" /> Historical CBT unavailable</span></>}
          </div>
        </article>;
      })}
    </section>

    <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 dark:border-slate-700 dark:bg-[#1b2045] md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-brand-700" /><h2 className="font-extrabold text-[#151A3A] dark:text-white">Class Practice</h2></div><p className="mt-1 text-sm text-slate-500">Practise questions generated from actual lessons in your selected class and subject. This is separate from external examination boards.</p></div><Link href="/dashboard/past-questions?experience=class" className="rounded-xl border border-[#151A3A] px-4 py-2.5 text-center text-sm font-bold text-[#151A3A] hover:bg-[#151A3A] hover:text-white dark:border-slate-300 dark:text-white">Open Class Practice</Link></section>
  </div>;
}
