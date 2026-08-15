'use client';

import { useState } from 'react';
import { ShieldCheckIcon, EyeOffIcon, EyeIcon, MessageSquareIcon } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import Flash from '@/components/ui/Flash';
import Badge, { statusTone } from '@/components/ui/Badge';
import { timeAgo, titleCase } from '@/utils/format';
import { useModeration } from './hooks';
import type { ModerationPost } from '@/services/api/adminService';

export default function ModerationQueue() {
  const { posts, loading, error, reload, setHidden } = useModeration();
  const [filter, setFilter] = useState<'all' | 'hidden' | 'published'>('all');
  const [working, setWorking] = useState<string | null>(null);
  const [flash, setFlash] = useState('');

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.status === filter);

  const toggle = async (post: ModerationPost) => {
    setWorking(post.id);
    const target = post.status === 'hidden';
    try {
      await setHidden(post.id, target);
      setFlash(`Post ${target ? 'hidden' : 'restored'}`);
    } catch (err) {
      setFlash((err as Error).message || 'Action failed');
    } finally {
      setWorking(null);
      setTimeout(() => setFlash(''), 3000);
    }
  };

  if (loading) return <Spinner label="Loading moderation queue..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(['all', 'published', 'hidden'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                filter === f ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <button onClick={reload} className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
          Refresh
        </button>
      </div>

      {flash && <Flash tone="success" message={flash} />}
      {error && <Flash tone="error" message={error} />}

      {filtered.length === 0 && !error ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          <ShieldCheckIcon className="w-10 h-10 mx-auto mb-3 text-green-400" />
          All content is clean!
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <div key={post.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <MessageSquareIcon className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 capitalize">
                      {titleCase(String(post.type ?? 'post'))}
                    </span>
                    <Badge tone={statusTone(post.status === 'hidden' ? 'inactive' : 'active')}>{post.status}</Badge>
                    <span className="text-xs text-gray-400 ml-auto">{timeAgo(post.created_at)}</span>
                  </div>
                  {post.title && <p className="font-medium text-gray-900 mt-2">{post.title}</p>}
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    By {post.first_name} {post.last_name} ({post.email})
                  </p>
                </div>
                <div className="flex gap-2">
                  {post.status === 'hidden' ? (
                    <button
                      onClick={() => toggle(post)}
                      disabled={working === post.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <EyeIcon className="w-4 h-4" /> Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => toggle(post)}
                      disabled={working === post.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <EyeOffIcon className="w-4 h-4" /> Hide
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
