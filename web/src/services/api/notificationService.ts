import { apiConfig, getAuthHeaders, handleApiError } from './config';
import type { PaginatedResponse } from '@/types/api/api';

const { baseUrl } = apiConfig;

// ========== NOTIFICATIONS ==========

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

export interface NotificationFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: string;
}

export const fetchNotifications = async (
  filters: NotificationFilters = {},
  token: string
): Promise<PaginatedResponse<Notification>> => {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const response = await fetch(`${baseUrl}/notifications?${query.toString()}`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const fetchUnreadNotifications = async (token: string): Promise<{ notifications: Notification[]; count: number }> => {
  const response = await fetch(`${baseUrl}/notifications/unread`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const markNotificationAsRead = async (notificationId: string, token: string) => {
  const response = await fetch(`${baseUrl}/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const markAllNotificationsAsRead = async (token: string) => {
  const response = await fetch(`${baseUrl}/notifications/read-all`, {
    method: 'POST',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const deleteNotification = async (notificationId: string, token: string) => {
  const response = await fetch(`${baseUrl}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const deleteAllNotifications = async (token: string) => {
  const response = await fetch(`${baseUrl}/notifications`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

// ========== NOTIFICATION PREFERENCES ==========

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  examReminders: boolean;
  courseUpdates: boolean;
  promotional: boolean;
}

export const fetchNotificationPreferences = async (token: string): Promise<{ preferences: NotificationPreferences }> => {
  const response = await fetch(`${baseUrl}/notifications/preferences`, {
    headers: getAuthHeaders(token),
  });
  return handleApiError(response);
};

export const updateNotificationPreferences = async (
  preferences: Partial<NotificationPreferences>,
  token: string
) => {
  const response = await fetch(`${baseUrl}/notifications/preferences`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(preferences),
  });
  return handleApiError(response);
};

// ========== REAL-TIME NOTIFICATIONS (WebSocket) ==========

export interface NotificationSocketMessage {
  type: 'notification' | 'read_receipt' | 'ping';
  data: Notification | { notificationId: string } | null;
}

let socket: WebSocket | null = null;
let messageCallback: ((message: NotificationSocketMessage) => void) | null = null;

export const connectNotificationSocket = (
  token: string,
  onMessage: (message: NotificationSocketMessage) => void
) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const socketUrl = `${protocol}//${host}/notifications?token=${token}`;

  socket = new WebSocket(socketUrl);
  messageCallback = onMessage;

  socket.onopen = () => {
    console.log('Notification socket connected');
  };

  socket.onmessage = (event) => {
    try {
      const message: NotificationSocketMessage = JSON.parse(event.data);
      if (messageCallback) {
        messageCallback(message);
      }
    } catch (error) {
      console.error('Error parsing notification message:', error);
    }
  };

  socket.onclose = () => {
    console.log('Notification socket disconnected');
    // Attempt to reconnect after a delay
    setTimeout(() => connectNotificationSocket(token, onMessage), 5000);
  };

  socket.onerror = (error) => {
    console.error('Notification socket error:', error);
  };
};

export const disconnectNotificationSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
    messageCallback = null;
  }
};

export const sendSocketMessage = (message: Omit<NotificationSocketMessage, 'type'>) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
};
