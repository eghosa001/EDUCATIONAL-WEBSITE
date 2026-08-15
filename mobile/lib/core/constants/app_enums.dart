class AppEnums {
  // User roles
  enum UserRole { student, parent, teacher, school, contentAdmin, superAdmin }

  // Education levels
  enum EducationLevel {
    earlyYears,
    primary,
    juniorSecondary,
    seniorSecondary,
    tertiary,
    professional,
    adultVocational,
  }

  // Question types
  enum QuestionType {
    mcq,
    trueFalse,
    fillBlank,
    matching,
    shortAnswer,
    essay,
    numerical,
    imageBased,
  }

  // Exam boards (Nigerian)
  enum ExamBoard {
    jamb,
    waec,
    neco,
    nabteb,
    postUtme,
    university,
    professional,
    custom,
  }

  // Subscription plans
  enum SubscriptionPlan {
    free,
    studentBasic,
    studentPremium,
    parent,
    teacher,
    school,
    enterprise,
  }

  // Payment status
  enum PaymentStatus {
    pending,
    completed,
    failed,
    refunded,
    cancelled,
  }

  // Notification types
  enum NotificationType {
    course,
    exam,
    assignment,
    payment,
    result,
    announcement,
    studyReminder,
    subscriptionExpiry,
    system,
  }

  // Lesson status
  enum LessonStatus { draft, review, approved, published, archived }

  // Course status
  enum CourseStatus { draft, review, approved, published, archived }

  // Exam status
  enum ExamStatus { draft, scheduled, active, completed, archived }

  // Content moderation status
  enum ModerationStatus { pending, approved, rejected, flagged }

  // Progress status
  enum ProgressStatus { notStarted, inProgress, completed, skipped }
}
