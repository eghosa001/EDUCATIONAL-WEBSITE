export interface DbUserRow {
  id: string;
  email: string;
  phone?: string | null;
  password_hash?: string | null;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  role?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  avatar_url?: string | null;
  is_verified: boolean;
  is_active: boolean;
  last_login_at?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbRoleRow {
  id: string;
  name: string;
  description?: string | null;
  permissions: Record<string, unknown>;
  created_at: string;
}

export interface DbUserRoleRow {
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by?: string | null;
}

export interface DbSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  refresh_token_hash?: string | null;
  device_info?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  expires_at: string;
  created_at: string;
}

export interface DbPasswordResetRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  used_at?: string | null;
  created_at: string;
}

export interface DbEducationSystemRow {
  id: string;
  name: string;
  code: string;
  country: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DbEducationLevelRow {
  id: string;
  education_system_id: string;
  name: string;
  code: string;
  description?: string | null;
  order_index: number;
  min_age?: number | null;
  max_age?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface DbProgramRow {
  id: string;
  education_level_id: string;
  name: string;
  code: string;
  description?: string | null;
  duration_years?: number | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface DbClassRow {
  id: string;
  program_id: string;
  name: string;
  code: string;
  description?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface DbTermRow {
  id: string;
  education_system_id: string;
  name: string;
  code: string;
  description?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface DbSubjectRow {
  id: string;
  education_system_id: string;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  order_index: number;
  is_core: boolean;
  is_active: boolean;
  created_at: string;
}

export interface DbTopicRow {
  id: string;
  subject_id: string;
  class_id?: string | null;
  term_id?: string | null;
  name: string;
  code: string;
  description?: string | null;
  learning_objectives?: string[] | null;
  order_index: number;
  estimated_hours?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSubtopicRow {
  id: string;
  topic_id: string;
  name: string;
  code: string;
  description?: string | null;
  learning_objectives?: string[] | null;
  order_index: number;
  estimated_hours?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCourseRow {
  id: string;
  subject_id?: string | null;
  class_id?: string | null;
  term_id?: string | null;
  teacher_id?: string | null;
  title: string;
  slug: string;
  short_description?: string | null;
  full_description?: string | null;
  thumbnail_url?: string | null;
  preview_video_url?: string | null;
  difficulty: string;
  status: string;
  price: number;
  currency: string;
  is_free: boolean;
  is_featured: boolean;
  enrollment_count: number;
  rating: number;
  review_count: number;
  total_duration_hours: number;
  lesson_count: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCourseSectionRow {
  id: string;
  course_id: string;
  title: string;
  description?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbLessonRow {
  id: string;
  course_id: string;
  section_id?: string | null;
  topic_id?: string | null;
  subtopic_id?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  learning_objectives?: string[] | null;
  content_type: string;
  video_url?: string | null;
  video_duration_seconds?: number | null;
  video_thumbnail_url?: string | null;
  written_content?: string | null;
  key_points?: string[] | null;
  order_index: number;
  is_free: boolean;
  is_published: boolean;
  estimated_minutes: number;
  view_count: number;
  completion_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbLessonResourceRow {
  id: string;
  lesson_id: string;
  title: string;
  resource_type: string;
  file_url: string;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  description?: string | null;
  is_downloadable: boolean;
  order_index: number;
  created_at: string;
}

export interface DbStudentCourseRow {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string | null;
  progress_percentage: number;
  last_accessed_at?: string | null;
  certificate_issued_at?: string | null;
  certificate_url?: string | null;
}

export interface DbLessonProgressRow {
  id: string;
  student_id: string;
  lesson_id: string;
  course_id: string;
  status: string;
  progress_percentage: number;
  watch_time_seconds: number;
  completed_at?: string | null;
  last_position_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface DbStudySessionRow {
  id: string;
  student_id: string;
  course_id?: string | null;
  lesson_id?: string | null;
  started_at: string;
  ended_at?: string | null;
  duration_seconds?: number | null;
  activity_type?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface DbQuestionRow {
  id: string;
  subject_id?: string | null;
  topic_id?: string | null;
  subtopic_id?: string | null;
  class_id?: string | null;
  question_type: string;
  question_text: string;
  question_image_url?: string | null;
  options?: unknown[] | null;
  correct_answer?: unknown | null;
  explanation?: string | null;
  explanation_image_url?: string | null;
  difficulty: string;
  marks: number;
  negative_marks: number;
  time_limit_seconds?: number | null;
  source?: string | null;
  exam_year?: number | null;
  exam_name?: string | null;
  tags?: string[] | null;
  is_active: boolean;
  usage_count: number;
  created_by?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbQuizRow {
  id: string;
  course_id: string;
  lesson_id?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  time_limit_minutes?: number | null;
  passing_score: number;
  max_attempts: number;
  shuffle_questions: boolean;
  show_explanation: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbQuizQuestionRow {
  id: string;
  quiz_id: string;
  question_id: string;
  order_index: number;
  marks: number;
}

export interface DbExamRow {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  exam_type: string;
  subject_id?: string | null;
  class_id?: string | null;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  instructions?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_timed: boolean;
  shuffle_questions: boolean;
  show_results_immediately: boolean;
  allow_review: boolean;
  max_attempts: number;
  is_active: boolean;
  is_public: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExamQuestionRow {
  id: string;
  exam_id: string;
  question_id: string;
  order_index: number;
  marks: number;
  section_name?: string | null;
}

export interface DbExamAttemptRow {
  id: string;
  exam_id: string;
  student_id: string;
  attempt_number: number;
  status: string;
  started_at: string;
  submitted_at?: string | null;
  time_spent_seconds?: number | null;
  score?: number | null;
  percentage?: number | null;
  is_passed?: boolean | null;
  rank?: number | null;
  total_students?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface DbExamAnswerRow {
  id: string;
  attempt_id: string;
  question_id: string;
  student_answer?: unknown | null;
  is_correct?: boolean | null;
  marks_obtained: number;
  time_spent_seconds?: number | null;
  answered_at: string;
}

export interface DbAssignmentRow {
  id: string;
  course_id: string;
  lesson_id?: string | null;
  teacher_id?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  assignment_type: string;
  max_score: number;
  due_date?: string | null;
  allow_late_submission: boolean;
  late_penalty_percent: number;
  max_file_size_mb: number;
  allowed_file_types?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSubmissionRow {
  id: string;
  assignment_id: string;
  student_id: string;
  content?: string | null;
  file_urls?: string[] | null;
  status: string;
  submitted_at: string;
  graded_at?: string | null;
  graded_by?: string | null;
  score?: number | null;
  feedback?: string | null;
  is_late: boolean;
}

export interface DbTeacherRow {
  id: string;
  school_id?: string | null;
  subject_ids?: string[] | null;
  verified: boolean;
  bio?: string | null;
  years_of_experience?: number | null;
  qualifications?: string[] | null;
  earnings: number;
}

export interface DbParentRow {
  id: string;
  student_ids?: string[] | null;
  occupation?: string | null;
}

export interface DbParentChildRow {
  id: string;
  parent_id: string;
  student_id: string;
  relationship: string;
  added_at: string;
}

export interface DbSchoolRow {
  id: string;
  name: string;
  code: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  state?: string | null;
  lga?: string | null;
  type?: string | null;
  logo_url?: string | null;
  established_year?: number | null;
  max_students?: number | null;
  status: string;
  admin_id?: string | null;
  subscription_id?: string | null;
  subscription_status: string;
  features?: Record<string, boolean> | null;
  settings?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DbSchoolStudentRow {
  id: string;
  school_id: string;
  student_id: string;
  class_id?: string | null;
  enrollment_year?: number | null;
  admission_number?: string | null;
  status: string;
  created_at: string;
}

export interface DbSchoolTeacherRow {
  id: string;
  school_id: string;
  teacher_id: string;
  employee_id?: string | null;
  department?: string | null;
  employment_date?: string | null;
  status: string;
  created_at: string;
}

export interface DbSchoolClassRow {
  id: string;
  school_id: string;
  class_id?: string | null;
  teacher_id?: string | null;
  capacity?: number | null;
  term_id?: string | null;
  academic_year?: number | null;
  status: string;
  created_at: string;
}

export interface DbSubscriptionPlanRow {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  price: number;
  currency: string;
  billing_cycle: string;
  duration_days: number;
  trial_days?: number | null;
  features?: string[] | null;
  limits?: Record<string, unknown> | null;
  is_active: boolean;
  is_popular: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DbSubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name?: string | null;
  plan_code?: string | null;
  gateway_subscription_id?: string | null;
  gateway: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbPaymentRow {
  id: string;
  reference: string;
  user_id: string;
  amount: number;
  currency: string;
  gateway: string;
  gateway_reference?: string | null;
  status: string;
  purpose: string;
  purpose_id?: string | null;
  metadata?: Record<string, unknown> | null;
  paid_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbTransactionRow {
  id: string;
  payment_id?: string | null;
  wallet_id?: string | null;
  user_id: string;
  type: string;
  amount: number;
  currency: string;
  balance_before: number;
  balance_after: number;
  reference?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface DbInvoiceRow {
  id: string;
  invoice_number: string;
  user_id: string;
  subscription_id?: string | null;
  payment_id?: string | null;
  amount: number;
  currency: string;
  tax_amount: number;
  discount_amount: number;
  status: string;
  due_date?: string | null;
  paid_at?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface DbWalletRow {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbWalletTransactionRow {
  id: string;
  wallet_id: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  reference: string;
  description: string;
  created_at: string;
}

export interface DbCouponRow {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  max_discount_amount?: number | null;
  min_purchase_amount?: number | null;
  usage_limit: number;
  times_used: number;
  valid_from: string;
  valid_until?: string | null;
  applicable_plans?: string[] | null;
  is_single_use: boolean;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbNotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  action_url?: string | null;
  channel: string;
  is_read: boolean;
  read_at?: string | null;
  sent_at?: string | null;
  created_at: string;
}

export interface DbBadgeRow {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  icon_url?: string | null;
  criteria?: Record<string, unknown> | null;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface DbAchievementRow {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  metadata?: Record<string, unknown> | null;
}

export interface DbStudentPointRow {
  id: string;
  user_id: string;
  total_points: number;
  current_streak: number;
  longest_streak: number;
  level: number;
  xp_to_next_level: number;
  updated_at: string;
}

export interface DbLeaderboardRow {
  id: string;
  type: string;
  period: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string | null;
  rank: number;
  points: number;
  stats?: Record<string, unknown> | null;
  period_start?: string | null;
  period_end?: string | null;
  created_at: string;
}

export interface DbAiConversationRow {
  id: string;
  user_id: string;
  course_id?: string | null;
  lesson_id?: string | null;
  topic_id?: string | null;
  title: string;
  context?: Record<string, unknown> | null;
  message_count: number;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAiMessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tokens_used?: number | null;
  model?: string | null;
  created_at: string;
}

export interface DbAiUsageRow {
  id: string;
  user_id: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost: number;
  created_at: string;
}

export interface DbFlashcardRow {
  id: string;
  course_id?: string | null;
  lesson_id?: string | null;
  topic_id?: string | null;
  subject_id?: string | null;
  title: string;
  description?: string | null;
  cards?: unknown[] | null;
  mode: string;
  is_public: boolean;
  created_by?: string | null;
  view_count: number;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface DbFlashcardReviewRow {
  id: string;
  flashcard_id: string;
  card_index: number;
  user_id: string;
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  reviews_count: number;
  last_answer_correct?: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DbLibraryResourceRow {
  id: string;
  title: string;
  slug: string;
  resource_type: string;
  file_url: string;
  thumbnail_url?: string | null;
  description?: string | null;
  subject_id?: string | null;
  topic_id?: string | null;
  class_id?: string | null;
  exam_board?: string | null;
  exam_year?: number | null;
  author_id?: string | null;
  download_count: number;
  view_count: number;
  is_free: boolean;
  file_size_bytes?: number | null;
  mime_type?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface DbCommunityPostRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string;
  subject_id?: string | null;
  topic_id?: string | null;
  course_id?: string | null;
  tags?: string[] | null;
  is_pinned: boolean;
  is_locked: boolean;
  views: number;
  likes_count: number;
  replies_count: number;
  last_reply_at?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbCommentRow {
  id: string;
  post_id?: string | null;
  parent_id?: string | null;
  user_id: string;
  content: string;
  likes_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbReportRow {
  id: string;
  type: string;
  title: string;
  description?: string | null;
  filters?: Record<string, unknown> | null;
  generated_by?: string | null;
  file_url?: string | null;
  status: string;
  error_message?: string | null;
  created_at: string;
  completed_at?: string | null;
}

export interface DbAuditLogRow {
  id: string;
  user_id?: string | null;
  action: string;
  resource_type?: string | null;
  resource_id?: string | null;
  changes?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export type DatabaseRowMap = {
  users: DbUserRow;
  roles: DbRoleRow;
  user_roles: DbUserRoleRow;
  sessions: DbSessionRow;
  password_resets: DbPasswordResetRow;
  education_systems: DbEducationSystemRow;
  education_levels: DbEducationLevelRow;
  programs: DbProgramRow;
  classes: DbClassRow;
  terms: DbTermRow;
  subjects: DbSubjectRow;
  topics: DbTopicRow;
  subtopics: DbSubtopicRow;
  courses: DbCourseRow;
  course_sections: DbCourseSectionRow;
  lessons: DbLessonRow;
  lesson_resources: DbLessonResourceRow;
  student_courses: DbStudentCourseRow;
  lesson_progress: DbLessonProgressRow;
  study_sessions: DbStudySessionRow;
  questions: DbQuestionRow;
  quizzes: DbQuizRow;
  quiz_questions: DbQuizQuestionRow;
  exams: DbExamRow;
  exam_questions: DbExamQuestionRow;
  exam_attempts: DbExamAttemptRow;
  exam_answers: DbExamAnswerRow;
  assignments: DbAssignmentRow;
  submissions: DbSubmissionRow;
  teachers: DbTeacherRow;
  parents: DbParentRow;
  parent_children: DbParentChildRow;
  schools: DbSchoolRow;
  school_students: DbSchoolStudentRow;
  school_teachers: DbSchoolTeacherRow;
  school_classes: DbSchoolClassRow;
  subscription_plans: DbSubscriptionPlanRow;
  subscriptions: DbSubscriptionRow;
  payments: DbPaymentRow;
  transactions: DbTransactionRow;
  invoices: DbInvoiceRow;
  notifications: DbNotificationRow;
  badges: DbBadgeRow;
  achievements: DbAchievementRow;
  student_points: DbStudentPointRow;
  leaderboards: DbLeaderboardRow;
  ai_conversations: DbAiConversationRow;
  ai_messages: DbAiMessageRow;
  ai_usage: DbAiUsageRow;
  flashcards: DbFlashcardRow;
  flashcard_reviews: DbFlashcardReviewRow;
  library_resources: DbLibraryResourceRow;
  community_posts: DbCommunityPostRow;
  comments: DbCommentRow;
  reports: DbReportRow;
  audit_logs: DbAuditLogRow;
};

export type DatabaseRow<T extends keyof DatabaseRowMap> = DatabaseRowMap[T];
