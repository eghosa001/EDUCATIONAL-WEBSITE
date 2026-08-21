export default function Loading() {
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><div className="text-center"><img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-[28%]" /><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 dark:border-brand-950 dark:border-t-brand-300" /><p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Loading THE GUIDE...</p></div></div>;
}
