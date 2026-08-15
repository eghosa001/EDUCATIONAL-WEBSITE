'use client';

import { useEffect, useState, useCallback } from 'react';
import { useNotificationStore } from '@/features/notifications/store/notificationStore';

export function useNotifications() {
  const { notifications, unreadCount, isLoading, error, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, clearAll, filterByType } = useNotificationStore();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = selectedType
    ? filterByType(selectedType)
    : filter === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return {
    notifications: filteredNotifications,
    allNotifications: notifications,
    unreadCount,
    isLoading,
    error,
    selectedType,
    setSelectedType,
    filter,
    setFilter,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchNotifications,
  };
}

export function useNotificationBell() {
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    setShowBadge(unreadCount > 0);
  }, [unreadCount]);

  return { unreadCount, showBadge };
}
