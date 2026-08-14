'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/state/auth/authStore';
import { login, register, logout as apiLogout, refreshToken as apiRefreshToken } from '@/services/api/authService';
import type { User } from '@/types/models/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => Promise<void>;
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
  const { user, token, isAuthenticated, isLoading, setUser, setToken, setLoading, logout: storeLogout } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('edu_user');
    const storedToken = localStorage.getItem('edu_token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setInitialized(true);
  }, [setUser, setToken]);

  const refreshSession = async () => {
    const currentToken = localStorage.getItem('edu_token');
    if (!currentToken) return;

    try {
      const response = await apiRefreshToken(currentToken);
      if (response.data?.tokens) {
        setToken(response.data.tokens.accessToken);
        localStorage.setItem('edu_token', response.data.tokens.accessToken);
        if (response.data.user) {
          setUser(response.data.user as User);
          localStorage.setItem('edu_user', JSON.stringify(response.data.user));
        }
      }
    } catch {
      handleLogout();
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await login(credentials);
      const { user: userData, tokens } = response.data;

      setUser(userData as User);
      setToken(tokens.accessToken);
      localStorage.setItem('edu_user', JSON.stringify(userData));
      localStorage.setItem('edu_token', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('edu_refresh_token', tokens.refreshToken);
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role: string }) => {
    setLoading(true);
    try {
      const response = await register(data);
      const { user: userData, tokens } = response.data;

      setUser(userData as User);
      setToken(tokens.accessToken);
      localStorage.setItem('edu_user', JSON.stringify(userData));
      localStorage.setItem('edu_token', tokens.accessToken);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const currentToken = localStorage.getItem('edu_token');
    if (currentToken) {
      try { await apiLogout(currentToken); } catch {}
    }
    localStorage.removeItem('edu_user');
    localStorage.removeItem('edu_token');
    localStorage.removeItem('edu_refresh_token');
    storeLogout();
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
