'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const recovered = useRef(false);

  useEffect(() => {
    if (recovered.current) return;
    recovered.current = true;
    const id = window.setTimeout(() => reset(), 300);
    return () => window.clearTimeout(id);
  }, [reset]);

  return <div className="flex min-h-[55vh] items-center justify-center px-4">
    <section className="max-w-md rounded-2xl border border-stone-200 bg-white p-7 text-center shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
      <h1 className="text-xl font-extrabold text-[#151A3A] dark:text-white">Course page is recovering</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">A navigation request was interrupted. I am reloading this course view automatically.</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center"><button onClick={() => reset()} className="rounded-xl bg-[#151A3A] px-5 py-2.5 text-sm font-bold text-white">Try again</button><Link href="/dashboard/courses" className="rounded-xl border border-stone-300 px-5 py-2.5 text-sm font-bold text-[#151A3A] dark:border-slate-600 dark:text-white">Back to courses</Link></div>
    </section>
  </div>;
}
