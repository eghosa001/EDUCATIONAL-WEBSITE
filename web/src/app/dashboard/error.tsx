'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="flex min-h-[60vh] items-center justify-center px-4"><div className="max-w-md text-center"><img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="mx-auto mb-4 h-16 w-16 rounded-[28%] shadow-brand-sm" /><h2 className="text-xl font-bold text-slate-950 dark:text-white">We couldn&apos;t load this page</h2><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Something unexpected happened. Your work is safe; please try again.</p><button onClick={() => reset()} className="mt-6 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-brand-sm hover:bg-brand-700">Try Again</button></div></div>;
}
