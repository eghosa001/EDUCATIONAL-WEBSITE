'use client';

import { create } from 'zustand';
import type { UserProfile } from '@/types/models/user';

interface ProfileState {
  profile: UserProfile | null;
  isEditing: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  setIsEditing: (isEditing: boolean) => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isEditing: false,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/users/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      set({ profile: data.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch profile', isLoading: false });
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      set({ profile: result.data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update profile', isLoading: false });
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('edu_token')}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to change password', isLoading: false });
      throw err;
    }
  },

  uploadAvatar: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/users/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
        body: formData,
      });
      const data = await response.json();
      set({ profile: { ...get().profile, avatar: data.data.url }, isLoading: false });
      return data.data.url;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to upload avatar', isLoading: false });
      return null;
    }
  },

  setIsEditing: (isEditing) => set({ isEditing }),
}));
