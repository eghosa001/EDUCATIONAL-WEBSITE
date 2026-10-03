'use client';

import { create } from 'zustand';
import type { User } from '@/types/models/user';
import { getSupabase } from '@/lib/supabase';
import { changePassword as changeAuthPassword, getCurrentUser } from '@/services/api/authService';
import { useAuthStore } from '@/state/auth/authStore';

export type ProfileUser = User & { phone?: string };

interface ProfileState {
  profile: ProfileUser | null;
  isEditing: boolean;
  isLoading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<User> & { phone?: string }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  setIsEditing: (isEditing: boolean) => void;
}

const readPhone = async (userId: string) => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('phone')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return String(data?.phone || '');
};

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isEditing: false,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user } = await getCurrentUser();
      const phone = await readPhone(user.id);
      set({ profile: { ...user, phone }, isLoading: false });
      useAuthStore.getState().setUser(user);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch profile', isLoading: false });
      throw err;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error('You must be signed in');

      const { data: existing, error: profileError } = await supabase
        .from('profiles')
        .select('first_name,last_name,phone,avatar_url')
        .eq('id', authData.user.id)
        .maybeSingle();
      if (profileError) throw new Error(profileError.message);

      const firstName = String(data.firstName ?? existing?.first_name ?? authData.user.user_metadata?.first_name ?? '').trim();
      const lastName = String(data.lastName ?? existing?.last_name ?? authData.user.user_metadata?.last_name ?? '').trim();
      const phone = String(data.phone ?? existing?.phone ?? '').trim();
      if (!firstName || !lastName) throw new Error('First name and last name are required');

      const now = new Date().toISOString();
      const { error: saveError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: authData.user.email || null,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        avatar_url: existing?.avatar_url || null,
        updated_at: now,
      }, { onConflict: 'id' });
      if (saveError) throw new Error(saveError.message);

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { first_name: firstName, last_name: lastName },
      });
      if (metadataError) throw new Error(metadataError.message);

      const { user } = await getCurrentUser();
      const profile = { ...user, phone };
      set({ profile, isLoading: false });
      useAuthStore.getState().setUser(user);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to update profile', isLoading: false });
      throw err;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    set({ isLoading: true, error: null });
    try {
      await changeAuthPassword({ currentPassword, newPassword });
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to change password', isLoading: false });
      throw err;
    }
  },

  uploadAvatar: async (file) => {
    set({ isLoading: true, error: null });
    try {
      if (!file.type.startsWith('image/')) throw new Error('Please choose an image file');
      if (file.size > 5 * 1024 * 1024) throw new Error('Profile image must be 5 MB or smaller');

      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error('You must be signed in');

      const path = `${authData.user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(path);
      const avatarUrl = publicData.publicUrl;
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
        .eq('id', authData.user.id);
      if (profileError) throw new Error(profileError.message);

      await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
      const { user } = await getCurrentUser();
      const phone = await readPhone(user.id);
      set({ profile: { ...user, phone }, isLoading: false });
      useAuthStore.getState().setUser(user);
      return avatarUrl;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to upload avatar', isLoading: false });
      return null;
    }
  },

  setIsEditing: (isEditing) => set({ isEditing }),
}));
