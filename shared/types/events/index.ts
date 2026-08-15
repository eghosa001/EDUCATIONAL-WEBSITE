export type DomainEventType =
  | 'user.registered'
  | 'user.login'
  | 'user.verified'
  | 'course.enrolled'
  | 'course.completed'
  | 'lesson.completed'
  | 'exam.scheduled'
  | 'exam.submitted'
  | 'exam.graded'
  | 'assignment.submitted'
  | 'assignment.graded'
  | 'payment.succeeded'
  | 'payment.failed'
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.expired'
  | 'notification.sent'
  | 'badge.earned'
  | 'streak.updated'
  | 'ai.chat.started'
  | 'content.published'
  | 'content.reviewed';

export interface DomainEvent<T = unknown> {
  id: string;
  type: DomainEventType;
  aggregateId?: string;
  aggregateType?: string;
  payload: T;
  occurredAt: string;
  version: number;
}

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface UserLoginPayload {
  userId: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  loginAt: string;
}

export interface UserVerifiedPayload {
  userId: string;
  email: string;
  verifiedAt: string;
}

export interface CourseEnrolledPayload {
  studentId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: string;
}

export interface CourseCompletedPayload {
  studentId: string;
  courseId: string;
  courseTitle: string;
  completedAt: string;
}

export interface LessonCompletedPayload {
  studentId: string;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  completedAt: string;
}

export interface ExamScheduledPayload {
  studentId: string;
  examId: string;
  examTitle: string;
  scheduledAt: string;
}

export interface ExamSubmittedPayload {
  studentId: string;
  examId: string;
  attemptId: string;
  score?: number;
  percentage?: number;
  submittedAt: string;
}

export interface ExamGradedPayload {
  studentId: string;
  examId: string;
  attemptId: string;
  score: number;
  percentage: number;
  isPassed: boolean;
  gradedAt: string;
}

export interface AssignmentSubmittedPayload {
  studentId: string;
  assignmentId: string;
  submissionId: string;
  submittedAt: string;
}

export interface AssignmentGradedPayload {
  studentId: string;
  assignmentId: string;
  submissionId: string;
  score: number;
  feedback?: string;
  gradedAt: string;
}

export interface PaymentSucceededPayload {
  userId: string;
  paymentId: string;
  reference: string;
  amount: number;
  currency: string;
  purpose: string;
  paidAt: string;
}

export interface PaymentFailedPayload {
  userId: string;
  paymentId: string;
  reference: string;
  reason?: string;
  failedAt: string;
}

export interface SubscriptionCreatedPayload {
  userId: string;
  subscriptionId: string;
  planId: string;
  planName: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

export interface SubscriptionRenewedPayload {
  userId: string;
  subscriptionId: string;
  planId: string;
  renewedAt: string;
}

export interface SubscriptionExpiredPayload {
  userId: string;
  subscriptionId: string;
  planId: string;
  expiredAt: string;
}

export interface NotificationSentPayload {
  userId: string;
  notificationId: string;
  type: string;
  channel: string;
  title: string;
  sentAt: string;
}

export interface BadgeEarnedPayload {
  userId: string;
  badgeId: string;
  badgeCode: string;
  xpReward: number;
  earnedAt: string;
}

export interface StreakUpdatedPayload {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  updatedAt: string;
}

export interface AiChatStartedPayload {
  userId: string;
  conversationId: string;
  subjectId?: string;
  topicId?: string;
  startedAt: string;
}

export interface ContentPublishedPayload {
  contentId: string;
  contentType: 'course' | 'lesson';
  title: string;
  authorId: string;
  publishedAt: string;
}

export interface ContentReviewedPayload {
  contentId: string;
  contentType: 'course' | 'lesson';
  decision: 'approved' | 'rejected';
  reviewerId: string;
  reviewedAt: string;
}

export interface EventPayloadMap {
  'user.registered': UserRegisteredPayload;
  'user.login': UserLoginPayload;
  'user.verified': UserVerifiedPayload;
  'course.enrolled': CourseEnrolledPayload;
  'course.completed': CourseCompletedPayload;
  'lesson.completed': LessonCompletedPayload;
  'exam.scheduled': ExamScheduledPayload;
  'exam.submitted': ExamSubmittedPayload;
  'exam.graded': ExamGradedPayload;
  'assignment.submitted': AssignmentSubmittedPayload;
  'assignment.graded': AssignmentGradedPayload;
  'payment.succeeded': PaymentSucceededPayload;
  'payment.failed': PaymentFailedPayload;
  'subscription.created': SubscriptionCreatedPayload;
  'subscription.renewed': SubscriptionRenewedPayload;
  'subscription.expired': SubscriptionExpiredPayload;
  'notification.sent': NotificationSentPayload;
  'badge.earned': BadgeEarnedPayload;
  'streak.updated': StreakUpdatedPayload;
  'ai.chat.started': AiChatStartedPayload;
  'content.published': ContentPublishedPayload;
  'content.reviewed': ContentReviewedPayload;
}

export type DomainEventOf<T extends DomainEventType> = Omit<DomainEvent, 'type' | 'payload'> & {
  type: T;
  payload: EventPayloadMap[T];
};

export interface PublishEventOptions {
  id?: string;
  aggregateId?: string;
  aggregateType?: string;
  occurredAt?: string;
  version?: number;
}

export const buildDomainEvent = <T extends DomainEventType>(
  type: T,
  payload: EventPayloadMap[T],
  options: PublishEventOptions = {}
): DomainEventOf<T> => ({
  id: options.id ?? '',
  type,
  payload,
  aggregateId: options.aggregateId,
  aggregateType: options.aggregateType,
  occurredAt: options.occurredAt ?? new Date().toISOString(),
  version: options.version ?? 1,
});
