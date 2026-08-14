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
