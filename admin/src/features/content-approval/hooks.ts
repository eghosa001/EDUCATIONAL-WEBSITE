'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import {
  fetchPendingContent,
  approveContent,
  rejectContent,
  type PendingCourse,
  type PendingLesson,
} from '@/services/api/adminService';

export interface PendingItem {
  id: string;
  type: 'course' | 'lesson';
  title: string;
  author: string;
  status: string;
  updatedAt: string;
}

export function useContentApproval() {
  const { token } = useAdminAuthStore();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approved, setApproved] = useState(0);
  const [rejected, setRejected] = useState(0);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchPendingContent(token)
      .then((res) => {
        const courses: PendingItem[] = (res.data.courses || []).map((c: PendingCourse) => ({
          id: c.id,
          type: 'course',
          title: c.title,
          author: c.teacher ? `${c.teacher.firstName} ${c.teacher.lastName}` : 'Unknown',
          status: c.status,
          updatedAt: c.updatedAt,
        }));
        const lessons: PendingItem[] = (res.data.lessons || []).map((l: PendingLesson) => ({
          id: l.id,
          type: 'lesson',
          title: l.title,
          author: l.teacher ? `${l.teacher.firstName} ${l.teacher.lastName}` : 'Unknown',
          status: 'pending_review',
          updatedAt: l.updatedAt,
        }));
        setItems([...courses, ...lessons]);
      })
      .catch((err: Error) => setError(err.message || 'Failed to load pending content'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = useCallback(
    async (item: PendingItem, action: 'approve' | 'reject') => {
      if (!token) return;
      await (action === 'approve' ? approveContent(token, item.type, item.id) : rejectContent(token, item.type, item.id));
      if (action === 'approve') setApproved((n) => n + 1);
      else setRejected((n) => n + 1);
      setItems((prev) => prev.filter((i) => i.id !== item.id || i.type !== item.type));
    },
    [token]
  );

  return { items, loading, error, reload: load, decide, approved, rejected };
}
