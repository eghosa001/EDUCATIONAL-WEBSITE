'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchUsers, type AdminUserRow } from '@/services/api/userService';
import { fetchUserProfile } from '@/services/api/teacherService';

export interface TeacherProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  taughtCourses?: number;
  enrolledCourses?: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export function useTeachers() {
  const { token } = useAdminAuthStore();
  const [teachers, setTeachers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchUsers(token, { page: 1, limit: 200 })
      .then((res) => {
        const rows = res.data.users || [];
        setTeachers(rows.filter((u) => (u.roles || []).includes('teacher')));
      })
      .catch((err: Error) => setError(err.message || 'Failed to load teachers'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const getProfile = useCallback(
    async (userId: string): Promise<TeacherProfile | null> => {
      if (!token) return null;
      try {
        const res = await fetchUserProfile(token, userId);
        const p = res.data.profile;
        const str = (v: unknown): string => (typeof v === 'string' ? v : '');
        const num = (v: unknown): number => (typeof v === 'number' ? v : Array.isArray(v) ? v.length : 0);
        const bool = (v: unknown): boolean => (typeof v === 'boolean' ? v : false);
        return {
          id: p.id,
          email: p.email,
          firstName: str(p.first_name ?? p.firstName),
          lastName: str(p.last_name ?? p.lastName),
          taughtCourses: num(p.taught_courses ?? p.taughtCourses),
          enrolledCourses: num(p.enrolled_courses ?? p.enrolledCourses),
          isVerified: bool(p.is_verified ?? p.isVerified),
          isActive: bool(p.is_active ?? p.isActive),
          createdAt: str(p.created_at ?? p.createdAt),
        };
      } catch {
        return null;
      }
    },
    [token]
  );

  return { teachers, loading, error, reload: load, getProfile };
}
