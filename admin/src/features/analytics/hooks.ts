'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchMetrics, fetchRevenueBreakdown, fetchCoursePerformance, type PlatformMetrics, type RevenueBreakdown, type CoursePerformance } from '@/services/api/analyticsService';

export function useAnalytics(dateRange: string = '30d') {
  const { token } = useAdminAuthStore();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [revenue, setRevenue] = useState<RevenueBreakdown[]>([]);
  const [topCourses, setTopCourses] = useState<CoursePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [metricsRes, revenueRes, coursesRes] = await Promise.all([
        fetchMetrics(dateRange, token).catch(() => ({ metrics: null })),
        fetchRevenueBreakdown('monthly', token).catch(() => ({ breakdown: [] })),
        fetchCoursePerformance(token).catch(() => ({ courses: [] })),
      ]);
      setMetrics(metricsRes.metrics ?? null);
      setRevenue(revenueRes.breakdown || []);
      setTopCourses(coursesRes.courses || []);
    } catch {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [dateRange, token]);

  useEffect(() => { load(); }, [load]);

  return { metrics, revenue, topCourses, loading, error, reload: load };
}
