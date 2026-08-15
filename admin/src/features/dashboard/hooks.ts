'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchDashboard, type DashboardData } from '@/services/api/adminService';

export function useDashboard() {
  const { token } = useAdminAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchDashboard(token)
      .then((res) => setData(res.data))
      .catch((err: Error) => setError(err.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
}
