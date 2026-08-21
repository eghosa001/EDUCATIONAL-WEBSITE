export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-4"><div className="h-12 w-12 rounded-lg bg-brand-100 dark:bg-brand-950/70" /><div className="flex-1 space-y-2">{Array.from({ length: lines }).map((_, i) => <div key={i} className={`h-4 rounded bg-slate-200 dark:bg-slate-800 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />)}</div></div></div>;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex gap-4 border-b border-slate-100 p-4 dark:border-slate-800">{Array.from({ length: cols }).map((_, i) => <div key={i} className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />)}</div>{Array.from({ length: rows }).map((_, r) => <div key={r} className="flex gap-4 border-b border-slate-50 p-4 dark:border-slate-800/60">{Array.from({ length: cols }).map((_, c) => <div key={c} className="h-4 w-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800/80" style={{ animationDelay: `${(r * cols + c) * 50}ms` }} />)}</div>)}</div>;
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: count }).map((_, i) => <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 h-3 w-16 rounded bg-brand-100 dark:bg-brand-950/70" /><div className="mb-2 h-7 w-20 rounded bg-slate-200 dark:bg-slate-800" /><div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/80" /></div>)}</div>;
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }).map((_, i) => <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"><div className="mb-3 h-32 rounded-lg bg-slate-200 dark:bg-slate-800" /><div className="mb-2 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" /><div className="mb-2 h-3 w-full rounded bg-slate-100 dark:bg-slate-800/80" /><div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800/80" /></div>)}</div>;
}

export function PageSkeleton() {
  return <div className="animate-pulse space-y-6"><div className="h-8 w-48 rounded bg-brand-100 dark:bg-brand-950/70" /><StatCardsSkeleton /><div className="h-12 w-full rounded bg-slate-200 dark:bg-slate-800" /><GridSkeleton /></div>;
}
