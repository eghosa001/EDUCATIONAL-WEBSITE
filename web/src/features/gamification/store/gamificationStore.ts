'use client';

import { create } from 'zustand';
import type { Badge, Achievement, LeaderboardEntry } from '@/types/models/gamification';

interface GamificationState {
  userXP: number;
  userLevel: number;
  badges: Badge[];
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUserData: () => Promise<void>;
  fetchBadges: () => Promise<void>;
  fetchAchievements: () => Promise<void>;
  fetchLeaderboard: (period?: string) => Promise<void>;
  addXP: (amount: number) => void;
  getXPToNextLevel: () => number;
  getProgressToNextLevel: () => number;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  userXP: 0,
  userLevel: 1,
  badges: [],
  achievements: [],
  leaderboard: [],
  isLoading: false,
  error: null,

  fetchUserData: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/gamification/user', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ userXP: data.data?.xp || 0, userLevel: data.data?.level || 1, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch data', isLoading: false });
    }
  },

  fetchBadges: async () => {
    try {
      const response = await fetch('/api/gamification/badges', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ badges: data.data });
    } catch (err) {
      console.error('Failed to fetch badges:', err);
    }
  },

  fetchAchievements: async () => {
    try {
      const response = await fetch('/api/gamification/achievements', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ achievements: data.data });
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    }
  },

  fetchLeaderboard: async (period = 'weekly') => {
    try {
      const response = await fetch(`/api/gamification/leaderboard?period=${period}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ leaderboard: data.data });
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  },

  addXP: (amount) => {
    set((state) => {
      const newXP = state.userXP + amount;
      const xpForNextLevel = state.userLevel * 1000;
      const newLevel = newXP >= xpForNextLevel ? state.userLevel + 1 : state.userLevel;
      return { userXP: newXP, userLevel: newLevel };
    });
  },

  getXPToNextLevel: () => get().userLevel * 1000,

  getProgressToNextLevel: () => {
    const { userXP, userLevel } = get();
    const xpForLevel = userLevel * 1000;
    const xpFromPreviousLevel = (userLevel - 1) * 1000;
    return (userXP - xpFromPreviousLevel) / (xpForLevel - xpFromPreviousLevel);
  },
}));
