'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchReports, createReport, type ReportRow, type ReportType } from '@/services/api/reportService';

export interface ReportData {
  report: ReportRow;
  data: unknown;
}

export function useReports() {
  const { token } = useAdminAuthStore();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchReports(token, 1, 100)
      .then((res) => setReports(res.data.reports || []))
      .catch((err: Error) => setError(err.message || 'Failed to load reports'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = useCallback(
    async (data: { type: ReportType; title?: string; description?: string; filters?: Record<string, unknown> }): Promise<ReportData | null> => {
      if (!token) return null;
      const res = await createReport(token, data);
      await load();
      return { report: res.data.report, data: res.data.data };
    },
    [token, load]
  );

  return { reports, loading, error, reload: load, generate };
}
