'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/state/auth/authStore';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser } from '@/services/api/authService';
import { getSupabase } from '@/lib/supabase';
import type { User } from '@/types/models/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role: 'student' | 'teacher' | 'parent' }) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated, isLoading, setUser, setToken, setRefreshToken, setLoading, logout: storeLogout } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  const supabase = getSupabase();

  /** Restore session from Supabase auth session, fallback to localStorage. */
  const restoreSession = async () => {
    // Try Supabase session first (handles cookie-based sessions automatically)
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const accessToken = sessionData.session.access_token;
      // Fetch user profile via API
      try {
        const response = await getCurrentUser(accessToken);
        if (response?.data?.user) {
          setUser(response.data.user as User);
          setToken(accessToken);
          setRefreshToken(sessionData.session.refresh_token || null);
          localStorage.setItem('edu_user', JSON.stringify(response.data.user));
          localStorage.setItem('edu_token', accessToken);
          if (sessionData.session.refresh_token) {
            localStorage.setItem('edu_refresh_token', sessionData.session.refresh_token);
          }
          setInitialized(true);
          return;
        }
      } catch {}
    }

    // Fallback to localStorage
    const storedUser = localStorage.getItem('edu_user');
    const storedToken = localStorage.getItem('edu_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      setRefreshToken(localStorage.getItem('edu_refresh_token'));
    }
    setInitialized(true);
  };

  useEffect(() => {
    restoreSession().catch(() => {
      setInitialized(true);
    });

    // Listen for auth changes (e.g. tab close, sign out from another device)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        localStorage.setItem('edu_token', session.access_token);
        if (session.refresh_token) {
          localStorage.setItem('edu_refresh_token', session.refresh_token);
        }
      } else {
        handleLogoutSilent();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshSession = async () => {
    const currentRefreshToken = localStorage.getItem('edu_refresh_token') || undefined;
    if (!currentRefreshToken) return;

    try {
      const { data } = await supabase.auth.refreshSession({ refresh_token: currentRefreshToken });
      if (data.session) {
        setToken(data.session.access_token);
        setRefreshToken(data.session.refresh_token);
        localStorage.setItem('edu_token', data.session.access_token);
        localStorage.setItem('edu_refresh_token', data.session.refresh_token);
      }
    } catch {
      handleLogoutSilent();
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await apiLogin(credentials);
      const { user: userData, session } = response.data;

      setUser(userData as User);
      const accessToken = session?.access_token || '';
      setToken(accessToken);
      setRefreshToken(session?.refresh_token || null);

      localStorage.setItem('edu_user', JSON.stringify(userData));
      localStorage.setItem('edu_token', accessToken);
      if (session?.refresh_token) {
        localStorage.setItem('edu_refresh_token', session.refresh_token);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role: 'student' | 'teacher' | 'parent' }) => {
    setLoading(true);
    try {
      const response = await apiRegister(data);
      const userData = response.data.user;

      setUser({ ...userData, role: data.role, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as User);
      setToken(null);
      setRefreshToken(null);
      localStorage.setItem('edu_user', JSON.stringify({ ...userData, role: data.role, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSilent = () => {
    localStorage.removeItem('edu_user');
    localStorage.removeItem('edu_token');
    localStorage.removeItem('edu_refresh_token');
    storeLogout();
  };

  const handleLogout = async () => {
    try {
      await apiLogout(localStorage.getItem('edu_token') || '');
    } catch {}
    await supabase.auth.signOut();
    handleLogoutSilent();
  };

  const logout = async () => {
    await handleLogout();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
