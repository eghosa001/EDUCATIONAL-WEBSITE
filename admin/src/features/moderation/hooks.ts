'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchModerationPosts, hidePost, unhidePost, type ModerationPost } from '@/services/api/adminService';

export function useModeration() {
  const { token } = useAdminAuthStore();
  const [posts, setPosts] = useState<ModerationPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchModerationPosts(token, 1, 100)
      .then((res) => setPosts(res.data.posts || []))
      .catch((err: Error) => setError(err.message || 'Failed to load moderation queue'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const setHidden = useCallback(
    async (postId: string, hidden: boolean) => {
      if (!token) return;
      await (hidden ? hidePost(token, postId) : unhidePost(token, postId));
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status: hidden ? 'hidden' : 'published' } : p)));
    },
    [token]
  );

  return { posts, loading, error, reload: load, setHidden };
}
