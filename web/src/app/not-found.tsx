import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="max-w-lg text-center">
        <img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="mx-auto mb-6 h-20 w-20 rounded-[28%] shadow-brand-sm" />
        <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-300">THE GUIDE</div>
        <h1 className="mb-2 text-6xl font-extrabold tracking-tight text-slate-950 dark:text-white">404</h1>
        <p className="mb-3 text-xl font-semibold text-slate-800 dark:text-slate-100">Page not found</p>
        <p className="mb-8 text-slate-500 dark:text-slate-400">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-brand-sm transition hover:bg-brand-700">Back to Dashboard</Link>
      </div>
    </div>
  );
}
