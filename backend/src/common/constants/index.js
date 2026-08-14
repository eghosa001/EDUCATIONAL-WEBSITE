export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const USER_ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  TEACHER: 'teacher',
  SCHOOL_ADMIN: 'school_admin',
  CONTENT_ADMIN: 'content_admin',
  SUPER_ADMIN: 'super_admin',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING_VERIFICATION: 'pending_verification',
};

export const COURSE_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
};

export const LESSON_CONTENT_TYPES = {
  VIDEO: 'video',
  TEXT: 'text',
  PDF: 'pdf',
  AUDIO: 'audio',
  INTERACTIVE: 'interactive',
  LIVE: 'live',
};

export const QUESTION_TYPES = {
  MCQ: 'mcq',
  TRUE_FALSE: 'true_false',
  FILL_BLANK: 'fill_blank',
  MATCHING: 'matching',
  SHORT_ANSWER: 'short_answer',
  ESSAY: 'essay',
  NUMERICAL: 'numerical',
  IMAGE_BASED: 'image_based',
  MULTIPLE_SELECT: 'multiple_select',
};

export const EXAM_TYPES = {
  PRACTICE: 'practice',
  TIMED_TEST: 'timed_test',
  MOCK: 'mock',
  PAST_QUESTIONS: 'past_questions',
  SUBJECT_TEST: 'subject_test',
  TOPIC_TEST: 'topic_test',
  FULL_EXAMINATION: 'full_examination',
  COMPETITION: 'competition',
};

export const EXAM_ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  EXPIRED: 'expired',
  ABANDONED: 'abandoned',
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  PAUSED: 'paused',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

export const PAYMENT_GATEWAYS = {
  FLUTTERWAVE: 'flutterwave',
  PAYSTACK: 'paystack',
  STRIPE: 'stripe',
  BANK_TRANSFER: 'bank_transfer',
  WALLET: 'wallet',
};

export const NOTIFICATION_TYPES = {
  COURSE_ENROLLED: 'course_enrolled',
  LESSON_COMPLETED: 'lesson_completed',
  EXAM_SCHEDULED: 'exam_scheduled',
  EXAM_REMINDER: 'exam_reminder',
  EXAM_RESULT: 'exam_result',
  ASSIGNMENT_DUE: 'assignment_due',
  ASSIGNMENT_GRADED: 'assignment_graded',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  SUBSCRIPTION_EXPIRING: 'subscription_expiring',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  NEW_COURSE: 'new_course',
  TEACHER_ANNOUNCEMENT: 'teacher_announcement',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  STUDY_REMINDER: 'study_reminder',
  STREAK_MILESTONE: 'streak_milestone',
  BADGE_EARNED: 'badge_earned',
  LEVEL_UP: 'level_up',
};

export const NOTIFICATION_CHANNELS = {
  PUSH: 'push',
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
  WHATSAPP: 'whatsapp',
};

export const DIFFICULTY_LEVELS = {
  BEGINNER: 'beginner',
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',
  EXPERT: 'expert',
};

export const EDUCATION_SYSTEMS = {
  NIGERIAN: 'nigerian',
  BRITISH: 'british',
  AMERICAN: 'american',
  INTERNATIONAL: 'international',
};

export const NIGERIAN_LEVELS = {
  EARLY_YEARS: 'early_years',
  PRIMARY: 'primary',
  JUNIOR_SECONDARY: 'junior_secondary',
  SENIOR_SECONDARY: 'senior_secondary',
  TERTIARY: 'tertiary',
  PROFESSIONAL: 'professional',
  ADULT_VOCATIONAL: 'adult_vocational',
};

export const NIGERIAN_EXAMS = {
  WAEC: 'waec',
  NECO: 'neco',
  JAMB: 'jamb',
  NABTEB: 'nabteb',
  POST_UTME: 'post_utme',
  UNIVERSITY: 'university',
  PROFESSIONAL: 'professional',
};

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
};

export const CURRENCIES = {
  NGN: 'NGN',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
};

export const FILE_TYPES = {
  VIDEO: 'video',
  DOCUMENT: 'document',
  IMAGE: 'image',
  AUDIO: 'audio',
  ARCHIVE: 'archive',
  OTHER: 'other',
};

export const CONTENT_WORKFLOW_STATUS = {
  DRAFT: 'draft',
  SUBMITTED_FOR_REVIEW: 'submitted_for_review',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
};

export const ACHIEVEMENT_TYPES = {
  COURSE_COMPLETION: 'course_completion',
  LESSON_COMPLETION: 'lesson_completion',
  EXAM_SCORE: 'exam_score',
  STUDY_STREAK: 'study_streak',
  QUESTIONS_ANSWERED: 'questions_answered',
  PERFECT_SCORE: 'perfect_score',
  FIRST_LOGIN: 'first_login',
  PROFILE_COMPLETE: 'profile_complete',
  SOCIAL_SHARE: 'social_share',
  REFERRAL: 'referral',
};

export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
};

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
  VERY_LONG: 86400,
};

export const RATE_LIMITS = {
  AUTH: { windowMs: 900000, max: 10 },
  API: { windowMs: 900000, max: 100 },
  AI_CHAT: { windowMs: 60000, max: 20 },
  FILE_UPLOAD: { windowMs: 3600000, max: 50 },
  PAYMENT: { windowMs: 3600000, max: 10 },
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  AI_ERROR: 'AI_ERROR',
};