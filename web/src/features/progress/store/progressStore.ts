'use client';

import { create } from 'zustand';
import type { ProgressData, SubjectPerformance, StudySession } from '@/types/models/progress';

interface ProgressState {
  overallProgress: ProgressData | null;
  subjectPerformance: SubjectPerformance[];
  studySessions: StudySession[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProgress: () => Promise<void>;
  fetchSubjectPerformance: () => Promise<void>;
  fetchStudySessions: (days?: number) => Promise<void>;
  getWeakTopics: () => string[];
  getStrongTopics: () => string[];
  getRecommendedTopics: () => string[];
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  overallProgress: null,
  subjectPerformance: [],
  studySessions: [],
  isLoading: false,
  error: null,

  fetchProgress: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/progress', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ overallProgress: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch progress', isLoading: false });
    }
  },

  fetchSubjectPerformance: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/progress/analytics', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ subjectPerformance: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch performance', isLoading: false });
    }
  },

  fetchStudySessions: async (days = 30) => {
    try {
      const response = await fetch(`/api/progress/sessions?days=${days}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ studySessions: data.data });
    } catch (err) {
      console.error('Failed to fetch study sessions:', err);
    }
  },

  getWeakTopics: () => {
    const performance = get().subjectPerformance;
    return performance
      .filter((s) => s.averageScore < 60)
      .map((s) => s.subject);
  },

  getStrongTopics: () => {
    const performance = get().subjectPerformance;
    return performance
      .filter((s) => s.averageScore >= 80)
      .map((s) => s.subject);
  },

  getRecommendedTopics: () => {
    const performance = get().subjectPerformance;
    return performance
      .filter((s) => s.averageScore < 70 && s.averageScore >= 60)
      .map((s) => s.subject);
  },
}));
