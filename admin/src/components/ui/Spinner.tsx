'use client';

export default function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">{label}</span>
      </div>
    </div>
  );
}
