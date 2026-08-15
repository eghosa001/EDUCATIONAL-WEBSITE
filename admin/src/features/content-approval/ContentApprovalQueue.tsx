'use client';

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, HourglassIcon, BookOpenIcon, FileTextIcon } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import { timeAgo, titleCase } from '@/utils/format';
import { useContentApproval } from './hooks';

export default function ContentApprovalQueue() {
  const { items, loading, error, reload, decide, approved, rejected } = useContentApproval();
  const [working, setWorking] = useState<string | null>(null);
  const [flash, setFlash] = useState('');

  const handle = async (id: string, type: string, action: 'approve' | 'reject') => {
    const item = items.find((i) => i.id === id && i.type === type);
    if (!item) return;
    setWorking(`${id}-${type}`);
    try {
      await decide(item, action);
      setFlash(`${titleCase(type)} ${action === 'approve' ? 'approved' : 'rejected'}`);
    } catch (err) {
      setFlash((err as Error).message || 'Action failed');
    } finally {
      setWorking(null);
      setTimeout(() => setFlash(''), 3000);
    }
  };

  if (loading) return <Spinner label="Loading pending content..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">Approved: {approved}</span>
          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium">Rejected: {rejected}</span>
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">Pending: {items.length}</span>
        </div>
        <button onClick={reload} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Refresh
        </button>
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}

      {items.length === 0 && !error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 text-gray-500">
          <CheckCircleIcon className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <p className="text-lg font-medium">All caught up!</p>
          <p className="text-sm">No pending content for approval</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={`${item.type}-${item.id}`} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  {item.type === 'course' ? (
                    <BookOpenIcon className="w-5 h-5 text-yellow-600" />
                  ) : (
                    <FileTextIcon className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium capitalize">{item.type}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <HourglassIcon className="w-3 h-3" /> {timeAgo(item.updatedAt)}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">by {item.author} · Status: {item.status}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handle(item.id, item.type, 'approve')}
                    disabled={working === `${item.id}-${item.type}`}
                    className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handle(item.id, item.type, 'reject')}
                    disabled={working === `${item.id}-${item.type}`}
                    className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircleIcon className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
