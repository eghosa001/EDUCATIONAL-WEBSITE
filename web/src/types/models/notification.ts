export type NotificationType = 'course' | 'exam' | 'assignment' | 'payment' | 'achievement' | 'system' | 'message' | 'reminder';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  channel: NotificationChannel;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
