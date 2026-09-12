'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParentStore } from '@/features/parent/store/parentStore';
import { apiConfig, getAuthHeaders, handleApiResponse } from '@/services/api/config';

export function useParentDashboard() {
  const {
    children,
    selectedChildId,
    dashboardData,
    isLoading,
    error,
    fetchChildren,
    setSelectedChild,
    fetchDashboardData,
    addChild,
    removeChild,
  } = useParentStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'courses' | 'results'>('overview');

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    const childId = selectedChildId || children[0]?.userId;
    if (childId) fetchDashboardData(childId);
  }, [selectedChildId, children, fetchDashboardData]);

  const handleSelectChild = useCallback(
    (childId: string) => {
      setSelectedChild(childId);
    },
    [setSelectedChild]
  );

  return {
    children,
    selectedChildId,
    dashboardData,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    handleSelectChild,
    addChild,
    removeChild,
  };
}

export function useChildMonitoring(childId: string) {
  const [studyTime, setStudyTime] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadActivity = async () => {
      setIsLoading(true);
      try {
        const token = typeof window === 'undefined' ? null : localStorage.getItem('edu_token');
        const response = await fetch(`${apiConfig.baseUrl}/parents/children/${childId}/study-time`, {
          headers: getAuthHeaders(token || undefined),
          credentials: apiConfig.credentials,
        });
        const payload = await handleApiResponse<{ data: { studyTime: Array<{ date: string; studyTimeSeconds: number }> } }>(response);
        const rows = payload.data?.studyTime || [];
        if (!cancelled) {
          setStudyTime(Math.round(rows.reduce((sum, row) => sum + Number(row.studyTimeSeconds || 0), 0) / 60));
          setRecentActivity(
            rows
              .slice()
              .reverse()
              .slice(0, 10)
              .map((row) => ({
                type: 'study',
                title: `${Math.round(Number(row.studyTimeSeconds || 0) / 60)} minutes studied`,
                timestamp: row.date,
              }))
          );
        }
      } catch (err) {
        console.error('Failed to load child study activity:', err);
        if (!cancelled) {
          setStudyTime(0);
          setRecentActivity([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadActivity();
    return () => {
      cancelled = true;
    };
  }, [childId]);

  return { studyTime, recentActivity, isLoading };
}
