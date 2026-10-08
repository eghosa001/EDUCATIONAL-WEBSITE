export default function DashboardLoading() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
        <div className="h-4 w-36 animate-pulse rounded-full bg-stone-200 dark:bg-slate-700" />
        <div className="mt-4 h-8 w-72 max-w-full animate-pulse rounded-xl bg-stone-200 dark:bg-slate-700" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded-full bg-stone-100 dark:bg-slate-800" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map(item => (
          <div key={item} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
            <div className="h-10 w-10 animate-pulse rounded-2xl bg-stone-200 dark:bg-slate-700" />
            <div className="mt-5 h-5 w-2/3 animate-pulse rounded-full bg-stone-200 dark:bg-slate-700" />
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full animate-pulse rounded-full bg-stone-100 dark:bg-slate-800" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-stone-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
