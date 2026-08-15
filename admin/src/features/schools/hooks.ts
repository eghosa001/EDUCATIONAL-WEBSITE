'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchSchools, deleteSchool, updateSchool, type SchoolRow } from '@/services/api/schoolService';

export function useSchools() {
  const { token } = useAdminAuthStore();
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchSchools(token, { page: 1, limit: 100 })
      .then((res) => setSchools(res.data.data || []))
      .catch((err: Error) => setError(err.message || 'Failed to load schools'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const removeSchool = useCallback(
    async (id: string) => {
      if (!token) return;
      await deleteSchool(token, id);
      setSchools((prev) => prev.filter((s) => s.id !== id));
    },
    [token]
  );

  const setStatus = useCallback(
    async (id: string, status: string) => {
      if (!token) return;
      await updateSchool(token, id, { status });
      setSchools((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    },
    [token]
  );

  return { schools, loading, error, reload: load, removeSchool, setStatus };
}
