'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchSchool, fetchSchoolStats, updateSchool, type SchoolRow, type SchoolStats } from '@/services/api/schoolService';

export function useSchool(id: string) {
  const { token } = useAdminAuthStore();
  const [school, setSchool] = useState<SchoolRow | null>(null);
  const [stats, setStats] = useState<SchoolStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token || !id) return;
    setLoading(true);
    Promise.all([fetchSchool(token, id), fetchSchoolStats(token, id)])
      .then(([s, st]) => {
        setSchool(s.data);
        setStats(st.data);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load school'))
      .finally(() => setLoading(false));
  }, [token, id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (data: Record<string, unknown>) => {
      if (!token) return;
      await updateSchool(token, id, data);
      await load();
    },
    [token, id, load]
  );

  return { school, stats, loading, error, reload: load, save };
}
