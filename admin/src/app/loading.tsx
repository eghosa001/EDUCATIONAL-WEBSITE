export default function Loading() {
  return (
    <main className="min-h-[50vh] flex items-center justify-center p-6" aria-label="Loading">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </main>
  );
}
