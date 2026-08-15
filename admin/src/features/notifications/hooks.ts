'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdminAuthStore } from '@/state/auth';
import {
  fetchNotificationStats,
  fetchNotificationHistory,
  broadcastNotification,
  broadcastToAll,
  type NotificationRow,
  type NotificationStats,
  type BroadcastPayload,
  type BroadcastAllPayload,
} from '@/services/api/notificationService';

export function useNotificationStats() {
  const { token } = useAdminAuthStore();
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchNotificationStats(token)
      .then((res) => setStats(res.data.stats))
      .catch((err: Error) => setError(err.message || 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, reload: load };
}

export function useNotificationHistory() {
  const { token } = useAdminAuthStore();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<{ type?: string; search?: string }>({});

  const load = useCallback(
    (pageNum = page) => {
      if (!token) return;
      setLoading(true);
      fetchNotificationHistory(token, { page: pageNum, limit: 20, ...filters })
        .then((res) => {
          setNotifications(res.data.notifications || []);
          setTotalPages(res.data.pagination.totalPages || 1);
          setTotal(res.data.pagination.total || 0);
        })
        .catch((err: Error) => setError(err.message || 'Failed to load history'))
        .finally(() => setLoading(false));
    },
    [token, page, filters]
  );

  useEffect(() => {
    load();
  }, [load]);

  const updateFilters = (next: { type?: string; search?: string }) => {
    setFilters(next);
    setPage(1);
  };

  return { notifications, loading, error, page, totalPages, total, filters, load, updateFilters, setPage };
}

export function useBroadcast() {
  const { token } = useAdminAuthStore();
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const send = useCallback(
    async (payload: BroadcastPayload): Promise<{ success: boolean; message: string }> => {
      if (!token) return { success: false, message: 'Not authenticated' };
      setSending(true);
      setLastResult('');
      try {
        const res = await broadcastNotification(token, payload);
        setLastResult(res.message);
        return { success: res.success, message: res.message };
      } catch (err) {
        const msg = (err as Error).message || 'Failed to send broadcast';
        setLastResult(msg);
        return { success: false, message: msg };
      } finally {
        setSending(false);
      }
    },
    [token]
  );

  const sendToAll = useCallback(
    async (payload: BroadcastAllPayload): Promise<{ success: boolean; message: string }> => {
      if (!token) return { success: false, message: 'Not authenticated' };
      setSending(true);
      setLastResult('');
      try {
        const res = await broadcastToAll(token, payload);
        setLastResult(res.message);
        return { success: res.success, message: res.message };
      } catch (err) {
        const msg = (err as Error).message || 'Failed to send broadcast';
        setLastResult(msg);
        return { success: false, message: msg };
      } finally {
        setSending(false);
      }
    },
    [token]
  );

  return { send, sendToAll, sending, lastResult };
}
