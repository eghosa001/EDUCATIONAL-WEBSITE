'use client';

import { useEffect, useRef } from 'react';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const didAutoReset = useRef(false);

  useEffect(() => {
    if (didAutoReset.current) return;
    didAutoReset.current = true;
    const id = window.setTimeout(() => reset(), 900);
    return () => window.clearTimeout(id);
  }, [reset]);

  return <div className="flex min-h-[60vh] items-center justify-center px-4"><div className="max-w-md text-center"><img src="/logos/app-icon.jfif" alt="THE GUIDE" className="mx-auto mb-4 h-16 w-16 rounded-[28%] object-cover shadow-brand-sm" /><h2 className="text-xl font-bold text-[#151A3A] dark:text-white">We&apos;re reconnecting this page</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">A dashboard request was interrupted. Your work is safe; the page will retry automatically.</p><button onClick={() => reset()} className="mt-6 rounded-xl bg-[#151A3A] px-6 py-2.5 text-sm font-semibold text-white shadow-brand-sm hover:bg-[#202750]">Try Again</button></div></div>;
}
