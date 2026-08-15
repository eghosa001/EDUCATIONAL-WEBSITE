import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { Pagination } from '@/types/api';

const { baseUrl } = apiConfig;

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push' | 'all';
export type NotificationType =
  | 'course'
  | 'exam'
  | 'assignment'
  | 'payment'
  | 'result'
  | 'announcement'
  | 'study_reminder'
  | 'subscription_expiry'
  | 'system'
  | 'custom';

export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title: string;
  body: string;
  channel: NotificationChannel;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationRow {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt?: string;
  actionUrl?: string;
  channel: string;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationStats {
  total: number;
  today: number;
  unread: number;
  byChannel: Array<{ channel: string; total: number }>;
  byType: Array<{ type: string; total: number }>;
}

export interface BroadcastPayload {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  channel: NotificationChannel;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export interface BroadcastAllPayload {
  type: NotificationType;
  title: string;
  body: string;
  channel: NotificationChannel;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

export const fetchNotificationStats = async (
  token: string
): Promise<{ data: { stats: NotificationStats } }> => {
  const response = await fetch(`${baseUrl}/notifications/admin/stats`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchNotificationHistory = async (
  token: string,
  filters: { page?: number; limit?: number; type?: string; search?: string } = {}
): Promise<{ data: { notifications: NotificationRow[]; pagination: Pagination } }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) params.append(key, String(value));
  });
  if (!params.has('page')) params.set('page', '1');
  if (!params.has('limit')) params.set('limit', '20');
  const response = await fetch(`${baseUrl}/notifications/admin/history?${params.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const broadcastNotification = async (
  token: string,
  payload: BroadcastPayload
): Promise<{ success: boolean; message: string; data: { notifications: NotificationRow[] } }> => {
  const response = await fetch(`${baseUrl}/notifications/admin/broadcast`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleApiError(response);
};

export const broadcastToAll = async (
  token: string,
  payload: BroadcastAllPayload
): Promise<{ success: boolean; message: string; data: { totalSent: number; totalUsers: number } }> => {
  const response = await fetch(`${baseUrl}/notifications/admin/broadcast/all`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleApiError(response);
};
