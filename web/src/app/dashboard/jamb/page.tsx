'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, BookOpenCheck, Clock3, GraduationCap, Loader2, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchExamBoardAvailability,
  type ExamBoardAvailabilityMap,
} from '@/services/api/examBoardService';

export default function JambHubPage() {
  const { token } = useAuth();
  const [availability, setAvailability] = useState<ExamBoardAvailabilityMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void fetchExamBoardAvailability(token)
      .then((data) => { if (!cancelled) setAvailability(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load JAMB question availability'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token]);

  const jamb = availability.jamb;

  return <div className="space-y-7">
    <header className="rounded-3xl bg-gradient-to-br from-[#151A3A] to-[#293866] p-7 text-white shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-200"><GraduationCap className="h-4 w-4" /> JAMB / UTME</div>
          <h1 className="mt-4 text-3xl font-extrabold">JAMB Preparation Centre</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">JAMB is kept separate from WAEC, NECO and NABTEB. Use Past Questions for focused subject revision, or run a timed four-subject CBT simulation.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
          <div><b className="block text-xl">{loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : jamb?.questionCount ?? 0}</b><span className="text-[11px] text-slate-300">graded MCQs</span></div>
          <div><b className="block text-xl">{loading ? '—' : jamb?.subjectIds?.length ?? 0}</b><span className="text-[11px] text-slate-300">subjects</span></div>
          <div><b className="block text-xl">{loading ? '—' : jamb?.years?.length ?? 0}</b><span className="text-[11px] text-slate-300">years</span></div>
        </div>
      </div>
    </header>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    <section className="grid gap-5 lg:grid-cols-2">
      <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950/40"><BookOpenCheck className="h-6 w-6" /></div>
        <h2 className="mt-5 text-2xl font-extrabold text-[#151A3A] dark:text-white">JAMB Past Questions</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Choose one subject, optionally filter by year, and work through verified JAMB questions without a countdown timer. This is for study and revision.</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-500">
          <li>• One subject at a time</li>
          <li>• Optional year filtering</li>
          <li>• Answer review and explanations after submission</li>
        </ul>
        <Link href="/dashboard/past-questions?board=jamb&experience=jamb-past" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#151A3A] px-4 py-3 font-bold text-[#151A3A] hover:bg-[#151A3A] hover:text-white dark:border-slate-300 dark:text-white">
          <BookOpenCheck className="h-4 w-4" /> Open JAMB Past Questions
        </Link>
      </article>

      <article className="rounded-2xl border border-[#151A3A] bg-[#151A3A] p-6 text-white shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Clock3 className="h-6 w-6" /></div>
        <h2 className="mt-5 text-2xl font-extrabold">JAMB CBT Examination</h2>
        <p className="mt-2 text-sm leading-6 text-slate-200">Simulate the JAMB structure with exactly four subjects and a live countdown. Questions are graded only after submission.</p>
        <ul className="mt-5 space-y-2 text-sm text-slate-300">
          <li>• Exactly four subjects</li>
          <li>• Timed CBT environment</li>
          <li>• Saved performance analytics</li>
        </ul>
        <Link href="/dashboard/past-questions?board=jamb&experience=jamb-cbt" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-[#151A3A] hover:bg-slate-100">
          <Clock3 className="h-4 w-4" /> Start JAMB CBT
        </Link>
      </article>
    </section>

    <section className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-6 dark:border-slate-700 dark:bg-[#1b2045] sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /><h2 className="font-extrabold text-[#151A3A] dark:text-white">Track your JAMB progress</h2></div>
        <p className="mt-1 text-sm text-slate-500">See recent sessions, accuracy by subject and weak topic areas from your graded practice.</p>
      </div>
      <Link href="/dashboard/past-questions/analytics" className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"><BarChart3 className="h-4 w-4" /> Performance</Link>
    </section>
  </div>;
}
