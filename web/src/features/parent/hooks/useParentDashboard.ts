'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParentStore } from '@/features/parent/store/parentStore';

export function useParentDashboard() {
  const { children, selectedChildId, dashboardData, isLoading, error, setSelectedChild, fetchDashboardData, addChild, removeChild } = useParentStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'courses' | 'results'>('overview');

  useEffect(() => {
    if (selectedChildId || children.length > 0) {
      fetchDashboardData(selectedChildId || children[0]?.id);
    }
  }, [selectedChildId, children.length]);

  const handleSelectChild = useCallback((childId: string) => {
    setSelectedChild(childId);
  }, [setSelectedChild]);

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
    const loadActivity = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/parents/children/${childId}/activity`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
        });
        const data = await response.json();
        setRecentActivity(data.data);
      } catch (err) {
        console.error('Failed to load activity:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadActivity();
  }, [childId]);

  return { studyTime, recentActivity, isLoading };
}
