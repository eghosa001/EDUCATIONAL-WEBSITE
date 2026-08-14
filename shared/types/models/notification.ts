export type NotificationType =
  | 'course_enrolled'
  | 'lesson_completed'
  | 'exam_scheduled'
  | 'exam_reminder'
  | 'exam_result'
  | 'assignment_due'
  | 'assignment_graded'
  | 'payment_success'
  | 'payment_failed'
  | 'subscription_expiring'
  | 'subscription_expired'
  | 'new_course'
  | 'teacher_announcement'
  | 'system_announcement'
  | 'study_reminder'
  | 'streak_milestone'
  | 'badge_earned'
  | 'level_up'
  | 'parent_alert'
  | 'school_announcement'
  | 'new_student'
  | 'result_published';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app' | 'whatsapp';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  actionUrl?: string;
  channel: NotificationChannel;
  isRead: boolean;
  readAt?: string;
  sentAt?: string;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  push: boolean;
  email: boolean;
  sms: boolean;
  inApp: boolean;
  whatsapp?: boolean;
  types: Partial<Record<NotificationType, boolean>>;
}
