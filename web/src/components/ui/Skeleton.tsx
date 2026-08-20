export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-200 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 border-b border-gray-50 flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 bg-gray-100 rounded w-20 animate-pulse" style={{ animationDelay: `${(r * cols + c) * 50}ms` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-16 mb-3" />
          <div className="h-7 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-3" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-full mb-2" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48" />
      <StatCardsSkeleton />
      <div className="h-12 bg-gray-200 rounded w-full" />
      <GridSkeleton />
    </div>
  );
}
