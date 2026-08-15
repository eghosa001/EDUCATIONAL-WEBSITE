'use client';

import { create } from 'zustand';
import type { Notification } from '@/types/models/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  getUnreadCount: () => number;
  filterByType: (type: string) => Notification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      const data = await response.json();
      const notifications = data.data || [];
      const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
      set({ notifications, unreadCount, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch notifications', isLoading: false });
    }
  },

  markAsRead: async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== notificationId),
        unreadCount: state.unreadCount,
      }));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  },

  clearAll: async () => {
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('edu_token')}` },
      });
      set({ notifications: [], unreadCount: 0 });
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  },

  getUnreadCount: () => get().notifications.filter((n) => !n.isRead).length,

  filterByType: (type) => get().notifications.filter((n) => n.type === type),
}));
