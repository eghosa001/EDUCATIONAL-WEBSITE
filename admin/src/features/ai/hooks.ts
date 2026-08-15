'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchAiUsage, type AiUsageStats } from '@/services/api/aiService';

export function useAiUsage() {
  const { token } = useAdminAuthStore();
  const [stats, setStats] = useState<AiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchAiUsage(token)
      .then((res) => setStats(res.data.stats || {}))
      .catch((err: Error) => setError(err.message || 'Failed to load AI usage'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, reload: load };
}
