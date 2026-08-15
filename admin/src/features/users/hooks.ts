'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import { fetchUsers, deactivateUser, type AdminUserRow } from '@/services/api/userService';

export function useUsers() {
  const { token } = useAdminAuthStore();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchUsers(token, { page: 1, limit: 200 })
      .then((res) => setUsers(res.data.users || []))
      .catch((err: Error) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const removeUser = useCallback(
    async (id: string) => {
      if (!token) return;
      await deactivateUser(token, id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)));
    },
    [token]
  );

  return { users, loading, error, reload: load, removeUser };
}

export const hasRole = (user: AdminUserRow, role: string): boolean => user.roles?.includes(role) ?? false;
