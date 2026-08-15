'use client';

import { create } from 'zustand';
import type { TeacherDashboardData, TeacherCourse, TeacherAnalytics } from '@/types/models/teacher';

interface TeacherState {
  dashboardData: TeacherDashboardData | null;
  courses: TeacherCourse[];
  analytics: TeacherAnalytics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboard: () => Promise<void>;
  fetchCourses: () => Promise<void>;
  fetchAnalytics: (period?: string) => Promise<void>;
  updateCourse: (courseId: string, data: Partial<TeacherCourse>) => void;
  getEarnings: () => Promise<number>;
}

export const useTeacherStore = create<TeacherState>((set, get) => ({
  dashboardData: null,
  courses: [],
  analytics: null,
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/teachers/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ dashboardData: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch dashboard', isLoading: false });
    }
  },

  fetchCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/teachers/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ courses: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch courses', isLoading: false });
    }
  },

  fetchAnalytics: async (period = '30d') => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/teachers/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ analytics: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch analytics', isLoading: false });
    }
  },

  updateCourse: (courseId, data) => {
    set((state) => ({
      courses: state.courses.map((c) => c.id === courseId ? { ...c, ...data } : c),
    }));
  },

  getEarnings: async () => {
    try {
      const response = await fetch('/api/teachers/earnings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      return data.data?.total || 0;
    } catch {
      return 0;
    }
  },
}));
