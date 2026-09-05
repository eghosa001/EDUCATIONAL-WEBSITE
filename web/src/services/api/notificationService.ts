import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'promotion';
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationFilters { page?: number; limit?: number; isRead?: boolean; type?: string; }

export const fetchNotifications = async (filters: NotificationFilters = {}, token: string): Promise<PaginatedResponse<Notification>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== null) query.append(key, String(value)); });
  const response = await fetch(`${baseUrl}/notifications?${query.toString()}`, { headers: getAuthHeaders(token), credentials: 'include' });
  return handleApiError(response);
};
export const fetchUnreadNotifications = async (token: string): Promise<{ notifications: Notification[]; count: number }> => {
  const response = await fetch(`${baseUrl}/notifications/unread`, { headers: getAuthHeaders(token), credentials: 'include' });
  return handleApiError(response);
};
export const markNotificationAsRead = async (notificationId: string, token: string) => handleApiError(await fetch(`${baseUrl}/notifications/${notificationId}/read`, { method: 'POST', headers: getAuthHeaders(token), credentials: 'include' }));
export const markAllNotificationsAsRead = async (token: string) => handleApiError(await fetch(`${baseUrl}/notifications/read-all`, { method: 'POST', headers: getAuthHeaders(token), credentials: 'include' }));
export const deleteNotification = async (notificationId: string, token: string) => handleApiError(await fetch(`${baseUrl}/notifications/${notificationId}`, { method: 'DELETE', headers: getAuthHeaders(token), credentials: 'include' }));
export const deleteAllNotifications = async (token: string) => handleApiError(await fetch(`${baseUrl}/notifications`, { method: 'DELETE', headers: getAuthHeaders(token), credentials: 'include' }));

export interface NotificationPreferences { email: boolean; push: boolean; sms: boolean; examReminders: boolean; courseUpdates: boolean; promotional: boolean; }
export const fetchNotificationPreferences = async (token: string): Promise<{ preferences: NotificationPreferences }> => handleApiError(await fetch(`${baseUrl}/notifications/preferences`, { headers: getAuthHeaders(token), credentials: 'include' }));
export const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>, token: string) => handleApiError(await fetch(`${baseUrl}/notifications/preferences`, { method: 'PATCH', headers: { ...getAuthHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify(preferences), credentials: 'include' }));

export interface NotificationSocketMessage { type: 'notification' | 'read_receipt' | 'ping'; data: Notification | { notificationId: string } | null; }

let socket: WebSocket | null = null;
let messageCallback: ((message: NotificationSocketMessage) => void) | null = null;
let intentionalDisconnect = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export const connectNotificationSocket = (token: string, onMessage: (message: NotificationSocketMessage) => void) => {
  if (typeof window === 'undefined' || !token) return;
  intentionalDisconnect = false;
  messageCallback = onMessage;
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socketUrl = `${protocol}//${window.location.host}/notifications?token=${encodeURIComponent(token)}`;
  const currentSocket = new WebSocket(socketUrl);
  socket = currentSocket;

  currentSocket.onopen = () => console.log('Notification socket connected');
  currentSocket.onmessage = (event) => {
    try {
      const message = JSON.parse(String(event.data)) as NotificationSocketMessage;
      if (message && typeof message.type === 'string') messageCallback?.(message);
    } catch (error) { console.error('Error parsing notification message:', error); }
  };
  currentSocket.onclose = () => {
    if (socket === currentSocket) socket = null;
    console.log('Notification socket disconnected');
    if (!intentionalDisconnect && messageCallback === onMessage) {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectNotificationSocket(token, onMessage);
      }, 5000);
    }
  };
  currentSocket.onerror = (error) => console.error('Notification socket error:', error);
};

export const disconnectNotificationSocket = () => {
  intentionalDisconnect = true;
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
  messageCallback = null;
  const currentSocket = socket;
  socket = null;
  if (currentSocket) currentSocket.close();
};

export const sendSocketMessage = (message: Omit<NotificationSocketMessage, 'type'>) => {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
};
