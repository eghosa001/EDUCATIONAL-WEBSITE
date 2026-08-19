export const USER_ROLES = ['student', 'parent', 'teacher', 'school_admin', 'content_admin', 'super_admin'] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'inactive', 'suspended', 'pending_verification'] as const;
export type UserStatusValue = (typeof USER_STATUSES)[number];

export const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type GenderValue = (typeof GENDERS)[number];

export const EDUCATION_SYSTEM_NAMES = ['nigerian', 'british', 'american', 'kenyan', 'ghanaian'] as const;
export type EducationSystemNameValue = (typeof EDUCATION_SYSTEM_NAMES)[number];

export const EDUCATION_LEVEL_CODES = [
  'NURSERY',
  'PRIMARY',
  'JSS1',
  'JSS2',
  'JSS3',
  'SSS1',
  'SSS2',
  'SSS3',
] as const;
export type EducationLevelCodeValue = (typeof EDUCATION_LEVEL_CODES)[number];

export const EDUCATION_LEVEL_NAMES = [
  'Nursery',
  'Primary School',
  'Junior Secondary 1',
  'Junior Secondary 2',
  'Junior Secondary 3',
  'Senior Secondary 1',
  'Senior Secondary 2',
  'Senior Secondary 3',
] as const;

export const EXAM_BOARDS = ['WAEC', 'NECO', 'NABTEB', 'JAMB', 'GCE', 'IGCSE', 'CIE', 'IB'] as const;
export type ExamBoardValue = (typeof EXAM_BOARDS)[number];

export const QUESTION_TYPES = [
  'mcq',
  'true_false',
  'fill_blank',
  'matching',
  'short_answer',
  'essay',
  'numerical',
  'image_based',
  'multiple_select',
] as const;
export type QuestionTypeValue = (typeof QUESTION_TYPES)[number];

export const DIFFICULTIES = ['beginner', 'easy', 'medium', 'hard', 'expert'] as const;
export type DifficultyValue = (typeof DIFFICULTIES)[number];

export const EXAM_TYPES = [
  'practice',
  'timed_test',
  'mock',
  'past_questions',
  'subject_test',
  'topic_test',
  'full_examination',
  'competition',
] as const;
export type ExamTypeValue = (typeof EXAM_TYPES)[number];

export const EXAM_ATTEMPT_STATUSES = ['in_progress', 'submitted', 'graded', 'expired', 'abandoned'] as const;
export type ExamAttemptStatusValue = (typeof EXAM_ATTEMPT_STATUSES)[number];

export const COURSE_STATUSES = ['draft', 'pending_review', 'approved', 'published', 'archived', 'rejected'] as const;
export type CourseStatusValue = (typeof COURSE_STATUSES)[number];

export const LESSON_CONTENT_TYPES = ['video', 'text', 'pdf', 'audio', 'interactive', 'live'] as const;
export type LessonContentTypeValue = (typeof LESSON_CONTENT_TYPES)[number];

export const BILLING_CYCLES = ['monthly', 'quarterly', 'yearly', 'once', 'one_time'] as const;
export type BillingCycleValue = (typeof BILLING_CYCLES)[number];

export const SUBSCRIPTION_STATUSES = ['active', 'cancelled', 'expired', 'past_due', 'trialing', 'paused'] as const;
export type SubscriptionStatusValue = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENT_GATEWAYS = ['paystack', 'flutterwave', 'stripe', 'wallet'] as const;
export type PaymentGatewayValue = (typeof PAYMENT_GATEWAYS)[number];

export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded', 'cancelled'] as const;
export type PaymentStatusValue = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PURPOSES = ['subscription', 'course', 'exam_package', 'single_purchase', 'topup'] as const;
export type PaymentPurposeValue = (typeof PAYMENT_PURPOSES)[number];

export const TRANSACTION_TYPES = ['credit', 'debit', 'refund', 'topup', 'purchase'] as const;
export type TransactionTypeValue = (typeof TRANSACTION_TYPES)[number];

export const INVOICE_STATUSES = ['pending', 'paid', 'overdue', 'cancelled'] as const;
export type InvoiceStatusValue = (typeof INVOICE_STATUSES)[number];

export const SCHOOL_TYPES = ['government', 'private', 'missionary', 'federal', 'state', 'local'] as const;
export type SchoolTypeValue = (typeof SCHOOL_TYPES)[number];

export const SCHOOL_STATUSES = ['active', 'suspended', 'pending_approval'] as const;
export type SchoolStatusValue = (typeof SCHOOL_STATUSES)[number];

export const SCHOOL_SUBSCRIPTION_STATUSES = ['free', 'active', 'expired', 'cancelled'] as const;
export type SchoolSubscriptionStatusValue = (typeof SCHOOL_SUBSCRIPTION_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  'course_enrolled',
  'lesson_completed',
  'exam_scheduled',
  'exam_reminder',
  'exam_result',
  'assignment_due',
  'assignment_graded',
  'payment_success',
  'payment_failed',
  'subscription_expiring',
  'subscription_expired',
  'new_course',
  'teacher_announcement',
  'system_announcement',
  'study_reminder',
  'streak_milestone',
  'badge_earned',
  'level_up',
  'parent_alert',
  'school_announcement',
  'new_student',
  'result_published',
] as const;
export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_CHANNELS = ['push', 'email', 'sms', 'in_app', 'whatsapp'] as const;
export type NotificationChannelValue = (typeof NOTIFICATION_CHANNELS)[number];

export const LIBRARY_RESOURCE_TYPES = [
  'textbook',
  'study_notes',
  'past_question',
  'research',
  'handout',
  'lecture_notes',
  'pdf',
  'article',
  'video',
] as const;
export type LibraryResourceTypeValue = (typeof LIBRARY_RESOURCE_TYPES)[number];

export const FLASHCARD_MODES = ['standard', 'spaced_repetition', 'shuffle', 'test_mode'] as const;
export type FlashcardModeValue = (typeof FLASHCARD_MODES)[number];

export const COMMUNITY_POST_TYPES = ['discussion', 'question', 'announcement', 'resource_share'] as const;
export type CommunityPostTypeValue = (typeof COMMUNITY_POST_TYPES)[number];

export const COMMUNITY_POST_STATUSES = ['published', 'draft', 'archived'] as const;
export type CommunityPostStatusValue = (typeof COMMUNITY_POST_STATUSES)[number];

export const COMMENT_STATUSES = ['published', 'moderated', 'deleted'] as const;
export type CommentStatusValue = (typeof COMMENT_STATUSES)[number];

export const AI_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type AiMessageRoleValue = (typeof AI_MESSAGE_ROLES)[number];

export const REPORT_STATUSES = ['pending', 'generating', 'completed', 'failed'] as const;
export type ReportStatusValue = (typeof REPORT_STATUSES)[number];

export const TABLE_PHASES = ['foundation', 'core', 'assessment', 'monetization', 'ai', 'ecosystem'] as const;
export type TablePhaseValue = (typeof TABLE_PHASES)[number];

export const CURRENCY = 'NGN' as const;

export const EDUCATION_LEVELS = EDUCATION_LEVEL_CODES.map((code, i) => ({
  code,
  name: EDUCATION_LEVEL_NAMES[i],
}));
