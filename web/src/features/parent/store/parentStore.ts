'use client';

import { create } from 'zustand';
import type { ParentDashboardData, ChildProgress } from '@/types/models/parent';

interface ParentState {
  children: ChildProgress[];
  selectedChildId: string | null;
  dashboardData: ParentDashboardData | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedChild: (childId: string | null) => void;
  fetchDashboardData: (childId?: string) => Promise<void>;
  addChild: (child: ChildProgress) => void;
  removeChild: (childId: string) => void;
}

export const useParentStore = create<ParentState>((set, get) => ({
  children: [],
  selectedChildId: null,
  dashboardData: null,
  isLoading: false,
  error: null,

  setSelectedChild: (childId) => set({ selectedChildId: childId }),

  fetchDashboardData: async (childId) => {
    set({ isLoading: true, error: null });
    try {
      // In production, call the API
      const response = await fetch(`/api/parents/monitor${childId ? `?childId=${childId}` : ''}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ dashboardData: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch data', isLoading: false });
    }
  },

  addChild: (child) => set((state) => ({ children: [...state.children, child] })),

  removeChild: (childId) => set((state) => ({
    children: state.children.filter((c) => c.id !== childId),
    selectedChildId: state.selectedChildId === childId ? null : state.selectedChildId,
  })),
}));
