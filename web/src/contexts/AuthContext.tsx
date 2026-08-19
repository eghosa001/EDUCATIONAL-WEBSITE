'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/state/auth/authStore';
import { login as apiLogin, register as apiRegister, logout as apiLogout, refreshToken as apiRefreshToken, getCurrentUser } from '@/services/api/authService';
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

  /** Restore session from server-side cookie (no token needed in request). */
  const restoreSession = async () => {
    try {
      const response = await getCurrentUser('');
      if (response?.data?.user) {
        setUser(response.data.user as User);
        setToken(response.data.tokens?.accessToken || null);
        setRefreshToken(response.data.tokens?.refreshToken || null);
        // Sync localStorage for stores that read from it directly
        localStorage.setItem('edu_user', JSON.stringify(response.data.user));
        if (response.data.tokens?.accessToken) {
          localStorage.setItem('edu_token', response.data.tokens.accessToken);
        }
        if (response.data.tokens?.refreshToken) {
          localStorage.setItem('edu_refresh_token', response.data.tokens.refreshToken);
        }
      } else {
        // No valid session — clear stale localStorage
        handleLogoutSilent();
      }
    } catch {
      handleLogoutSilent();
    }
  };

  useEffect(() => {
    // Try cookie-based session restore first
    restoreSession().catch(() => {
      // If cookie auth fails, fall back to localStorage
      const storedUser = localStorage.getItem('edu_user');
      const storedToken = localStorage.getItem('edu_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
        setRefreshToken(localStorage.getItem('edu_refresh_token'));
      }
    });
    setInitialized(true);
  }, [setUser, setToken, setRefreshToken]);

  const refreshSession = async () => {
    const currentRefreshToken = localStorage.getItem('edu_refresh_token') || undefined;
    if (!currentRefreshToken) return;

    try {
      const response = await apiRefreshToken(currentRefreshToken);
      if (response.data?.tokens) {
        setToken(response.data.tokens.accessToken);
        setRefreshToken(response.data.tokens.refreshToken);
        localStorage.setItem('edu_token', response.data.tokens.accessToken);
        localStorage.setItem('edu_refresh_token', response.data.tokens.refreshToken);
      }
    } catch {
      handleLogoutSilent();
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await apiLogin(credentials);
      const { user: userData, tokens } = response.data;

      setUser(userData as User);
      setToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      // Cookie is set server-side via HttpOnly; also sync localStorage for direct API calls
      localStorage.setItem('edu_user', JSON.stringify(userData));
      localStorage.setItem('edu_token', tokens.accessToken);
      localStorage.setItem('edu_refresh_token', tokens.refreshToken);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role: 'student' | 'teacher' | 'parent' }) => {
    setLoading(true);
    try {
      const response = await apiRegister(data);
      const { user: userData, tokens } = response.data;

      setUser({ ...userData, role: data.role, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as User);
      setToken(tokens.accessToken);
      setRefreshToken(tokens.refreshToken);
      // Cookie is set server-side via HttpOnly; also sync localStorage for direct API calls
      localStorage.setItem('edu_user', JSON.stringify({ ...userData, role: data.role, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
      localStorage.setItem('edu_token', tokens.accessToken);
      localStorage.setItem('edu_refresh_token', tokens.refreshToken);
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
