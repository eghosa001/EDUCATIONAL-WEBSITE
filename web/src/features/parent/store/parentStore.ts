'use client';

import { create } from 'zustand';
import type { ParentDashboardData, ChildProgress } from '@/types/models/parent';
import { apiConfig, getAuthHeaders, handleApiResponse } from '@/services/api/config';

interface ParentState {
  children: ChildProgress[];
  selectedChildId: string | null;
  dashboardData: ParentDashboardData | null;
  isLoading: boolean;
  error: string | null;
  fetchChildren: () => Promise<void>;
  setSelectedChild: (childId: string | null) => void;
  fetchDashboardData: (childId?: string) => Promise<void>;
  addChild: (child: ChildProgress) => void;
  removeChild: (childId: string) => void;
}

type ChildApiRow = {
  userId: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
};

type PerformanceApi = {
  userId: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  lessonsCompleted: number;
  examsTaken: number;
  averageExamScore: number;
  studyTimeSeconds: number;
  currentStreak: number;
  lastActiveAt: string | null;
};

const token = () => (typeof window === 'undefined' ? null : localStorage.getItem('edu_token'));

export const useParentStore = create<ParentState>((set, get) => ({
  children: [],
  selectedChildId: null,
  dashboardData: null,
  isLoading: false,
  error: null,

  fetchChildren: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${apiConfig.baseUrl}/parents/children`, {
        headers: getAuthHeaders(token() || undefined),
        credentials: apiConfig.credentials,
      });
      const payload = await handleApiResponse<{ data: { children: ChildApiRow[] } }>(response);
      const children = (payload.data?.children || []).map((child) => ({
        id: child.userId,
        userId: child.userId,
        userName: [child.firstName, child.lastName].filter(Boolean).join(' ') || 'Student',
        userAvatar: child.avatar || undefined,
        coursesEnrolled: 0,
        averageScore: 0,
        studyTimeMinutes: 0,
        currentStreak: 0,
        weakSubjects: [],
        strongSubjects: [],
        lastActiveAt: '',
      }));
      set((state) => ({
        children,
        selectedChildId: state.selectedChildId || children[0]?.userId || null,
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load linked children', isLoading: false });
    }
  },

  setSelectedChild: (childId) => set({ selectedChildId: childId }),

  fetchDashboardData: async (childId) => {
    const targetId = childId || get().selectedChildId;
    if (!targetId) {
      set({ dashboardData: null, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const headers = getAuthHeaders(token() || undefined);
      const [performanceResponse, progressResponse] = await Promise.all([
        fetch(`${apiConfig.baseUrl}/parents/children/${targetId}/performance`, {
          headers,
          credentials: apiConfig.credentials,
        }),
        fetch(`${apiConfig.baseUrl}/parents/children/${targetId}/progress`, {
          headers,
          credentials: apiConfig.credentials,
        }),
      ]);

      const performancePayload = await handleApiResponse<{ data: { performance: PerformanceApi } }>(performanceResponse);
      const progressPayload = await handleApiResponse<{ data: { progress: any } }>(progressResponse);
      const performance = performancePayload.data.performance;
      const child = get().children.find((item) => item.userId === targetId);

      const dashboardData: ParentDashboardData = {
        childId: targetId,
        userName: child?.userName || 'Student',
        coursesCompleted: performance.coursesCompleted || 0,
        lessonsCompleted: performance.lessonsCompleted || 0,
        quizzesTaken: Number(progressPayload.data?.progress?.quizzesTaken || 0),
        averageScore: performance.averageExamScore || 0,
        totalStudyTimeMinutes: Math.round((performance.studyTimeSeconds || 0) / 60),
        currentStreak: performance.currentStreak || 0,
        subjectPerformance: Array.isArray(progressPayload.data?.progress?.subjectPerformance)
          ? progressPayload.data.progress.subjectPerformance
          : [],
        recentActivity: Array.isArray(progressPayload.data?.progress?.recentActivity)
          ? progressPayload.data.progress.recentActivity
          : [],
      };

      set((state) => ({
        dashboardData,
        children: state.children.map((item) =>
          item.userId === targetId
            ? {
                ...item,
                coursesEnrolled: performance.coursesEnrolled || 0,
                averageScore: performance.averageExamScore || 0,
                studyTimeMinutes: dashboardData.totalStudyTimeMinutes,
                currentStreak: performance.currentStreak || 0,
                lastActiveAt: performance.lastActiveAt || '',
              }
            : item
        ),
        isLoading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch parent dashboard data', isLoading: false });
    }
  },

  addChild: (child) => set((state) => ({ children: [...state.children, child] })),

  removeChild: (childId) =>
    set((state) => ({
      children: state.children.filter((child) => child.userId !== childId),
      selectedChildId: state.selectedChildId === childId ? null : state.selectedChildId,
      dashboardData: state.selectedChildId === childId ? null : state.dashboardData,
    })),
}));
