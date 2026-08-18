'use client';

import { ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: Array<'student' | 'teacher' | 'parent' | 'admin'>;
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && allowedRoles && user) {
      const hasAccess = allowedRoles.includes(user.role as 'student' | 'teacher' | 'parent' | 'admin');
      if (!hasAccess) {
        router.replace('/unauthorized');
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as 'student' | 'teacher' | 'parent' | 'admin')) {
    return null;
  }

  return <>{children}</>;
}

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const checkAccess = useCallback(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login');
      return false;
    }
    return true;
  }, [isAuthenticated, isLoading, router]);

  return { isAuthenticated, isLoading, checkAccess };
}
