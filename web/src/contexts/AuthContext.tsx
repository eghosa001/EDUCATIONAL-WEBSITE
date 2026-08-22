'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthStore } from '@/state/auth/authStore';
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

async function loadProfile(supabase: ReturnType<typeof getSupabase>, authUser: any): Promise<User> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  const { data: roleRows } = await supabase
    .from('user_roles')
    .select('roles(name, permissions)')
    .eq('user_id', authUser.id);

  const roles = (roleRows || []).map((row: any) => row.roles?.name).filter(Boolean) as string[];
  const role = (roles[0] || authUser.user_metadata?.role || 'student') as User['role'];
  const createdAt = profile?.created_at || authUser.created_at || new Date().toISOString();

  return {
    id: authUser.id,
    email: authUser.email || profile?.email || '',
    firstName: profile?.first_name || authUser.user_metadata?.first_name || '',
    lastName: profile?.last_name || authUser.user_metadata?.last_name || '',
    role,
    avatar: profile?.avatar_url || undefined,
    createdAt,
    updatedAt: profile?.updated_at || createdAt,
  } as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthenticated, isLoading, setUser, setToken, setRefreshToken, setLoading, logout: storeLogout } = useAuthStore();
  const [, setInitialized] = useState(false);

  // Next.js can render client components during static generation. Keep the
  // Supabase client completely lazy so build-time rendering never requires
  // browser runtime environment variables.
  const getClient = () => getSupabase();

  const clearLocalAuth = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('edu_user');
    // Supabase owns persistence and refresh-token storage. Do not duplicate
    // access/refresh tokens in application-managed localStorage keys.
    storeLogout();
  };

  const applySession = async (session: any) => {
    const supabase = getClient();
    if (!session?.user) {
      clearLocalAuth();
      return;
    }
    const userData = await loadProfile(supabase, session.user);
    setUser(userData);
    setToken(session.access_token);
    setRefreshToken(session.refresh_token || null);
    if (typeof window !== 'undefined') localStorage.setItem('edu_user', JSON.stringify(userData));
  };

  const restoreSession = async () => {
    const supabase = getClient();
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user) {
      clearLocalAuth();
      setInitialized(true);
      setLoading(false);
      return;
    }

    try {
      await applySession(data.session);
    } catch (error) {
      console.error('[auth] Failed to restore profile:', error);
      clearLocalAuth();
    } finally {
      setInitialized(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    const supabase = getClient();

    restoreSession().catch((error) => {
      console.error('[auth] Session restore failed:', error);
      clearLocalAuth();
      setInitialized(true);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        await applySession(session);
      } catch (error) {
        console.error('[auth] Failed to apply auth state:', error);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async ({ email, password }: { email: string; password: string }) => {
    const supabase = getClient();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error || !data.user || !data.session) throw new Error(error?.message || 'Invalid email or password');
      await applySession(data.session);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { email: string; password: string; firstName: string; lastName: string; role: 'student' | 'teacher' | 'parent' }) => {
    const supabase = getClient();
    setLoading(true);
    try {
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: { data: { first_name: data.firstName, last_name: data.lastName, role: data.role } },
      });
      if (error) throw new Error(error.message);
      if (!result.user) throw new Error('Registration failed');
      if (result.session) {
        await applySession(result.session);
      } else {
        throw new Error('Registration succeeded, but email verification is required before signing in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    const supabase = getClient();
    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session?.user) {
      clearLocalAuth();
      return;
    }
    await applySession(data.session);
  };

  const logout = async () => {
    const supabase = getClient();
    await supabase.auth.signOut();
    clearLocalAuth();
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, register, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
