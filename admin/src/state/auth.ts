'use client';

import { create } from 'zustand';
import type { UserRole } from '@/types/models/user';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roles: UserRole[];
}

interface AdminAuthState {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  setUser: (user: AdminUser | null) => void;
  setToken: (token: string | null) => void;
  login: (user: AdminUser, token: string) => void;
  logout: () => void;
}

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'admin_user';

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  hydrated: false,
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ token });
  },
  login: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

export const hydrateAdminAuth = () => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  let user: AdminUser | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as AdminUser;
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }
  useAdminAuthStore.setState({ user, token, isAuthenticated: Boolean(token && user), hydrated: true });
};
