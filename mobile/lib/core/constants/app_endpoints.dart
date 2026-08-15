class AppEndpoints {
  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String changePassword = '/auth/change-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-verification';

  // Users
  static const String users = '/users';
  static const String usersProfile = '/users/profile';
  static const String usersUpdate = '/users/update';

  // Education
  static const String educationLevels = '/education/levels';
  static const String educationPrograms = '/education/programs';
  static const String educationClasses = '/education/classes';
  static const String educationTerms = '/education/terms';

  // Curriculum
  static const String curriculumSubjects = '/curriculum/subjects';
  static const String curriculumTopics = '/curriculum/topics';
  static const String curriculumSubtopics = '/curriculum/subtopics';

  // Courses
  static const String courses = '/courses';
  static const String coursesDetail = '/courses/{id}';
  static const String coursesEnroll = '/courses/{id}/enroll';
  static const String coursesSaved = '/courses/saved';
  static const String coursesRecent = '/courses/recent';

  // Lessons
  static const String lessons = '/lessons';
  static const String lessonsDetail = '/lessons/{id}';
  static const String lessonsComplete = '/lessons/{id}/complete';
  static const String lessonsProgress = '/lessons/{id}/progress';

  // Exams
  static const String exams = '/exams';
  static const String examsDetail = '/exams/{id}';
  static const String examsStart = '/exams/{id}/start';
  static const String examsSubmit = '/exams/{id}/submit';
  static const String examsResults = '/exams/{id}/results';

  // Assessments
  static const String assessments = '/assessments';
  static const String assessmentsQuiz = '/assessments/quiz';
  static const String assessmentsGenerate = '/assessments/generate';

  // Questions
  static const String questions = '/questions';
  static const String questionsDetail = '/questions/{id}';
  static const String questionsSearch = '/questions/search';

  // Past Questions
  static const String pastQuestions = '/past-questions';
  static const String pastQuestionsBoard = '/past-questions/{board}';
  static const String pastQuestionsSubject = '/past-questions/{board}/{subject}';

  // Assignments
  static const String assignments = '/assignments';
  static const String assignmentsDetail = '/assignments/{id}';
  static const String assignmentsSubmit = '/assignments/{id}/submit';
  static const String assignmentsGrade = '/assignments/{id}/grade';

  // Progress
  static const String progress = '/progress';
  static const String progressCourses = '/progress/courses';
  static const String progressLessons = '/progress/lessons';
  static const String progressAnalytics = '/progress/analytics';

  // Library
  static const String library = '/library';
  static const String librarySearch = '/library/search';
  static const String libraryDownload = '/library/download';

  // AI
  static const String aiChat = '/ai/chat';
  static const String aiExplain = '/ai/explain';
  static const String aiGenerateQuiz = '/ai/generate-quiz';
  static const String aiStudyPlan = '/ai/study-plan';
  static const String aiSummary = '/ai/summary';
  static const String aiFlashcards = '/ai/flashcards';

  // Flashcards
  static const String flashcards = '/flashcards';
  static const String flashcardsReview = '/flashcards/review';
  static const String flashcardsGenerate = '/flashcards/generate';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsMarkRead = '/notifications/{id}/read';
  static const String notificationsMarkAllRead = '/notifications/read-all';

  // Subscriptions
  static const String subscriptions = '/subscriptions';
  static const String subscriptionsPlans = '/subscriptions/plans';
  static const String subscriptionsActivate = '/subscriptions/activate';
  static const String subscriptionsCancel = '/subscriptions/cancel';
  static const String subscriptionsStatus = '/subscriptions/status';

  // Payments
  static const String payments = '/payments';
  static const String paymentsInitiate = '/payments/initiate';
  static const String paymentsVerify = '/payments/verify';
  static const String paymentsHistory = '/payments/history';
  static const String paymentsRefund = '/payments/{id}/refund';

  // Community
  static const String communityPosts = '/community/posts';
  static const String communityComments = '/community/comments';
  static const String communityStudyGroups = '/community/study-groups';
  static const String communityForum = '/community/forums';

  // Gamification
  static const String gamificationXp = '/gamification/xp';
  static const String gamificationBadges = '/gamification/badges';
  static const String gamificationLeaderboard = '/gamification/leaderboard';
  static const String gamificationAchievements = '/gamification/achievements';

  // Search
  static const String search = '/search';
  static const String searchGlobal = '/search/global';

  // Analytics
  static const String analytics = '/analytics';
  static const String analyticsPerformance = '/analytics/performance';

  // Teachers
  static const String teachers = '/teachers';
  static const String teachersCourses = '/teachers/courses';
  static const String teachersEarnings = '/teachers/earnings';

  // Parents
  static const String parents = '/parents';
  static const String parentsChildren = '/parents/children';
  static const String parentsMonitor = '/parents/monitor';

  // Schools
  static const String schools = '/schools';
  static const String schoolsDetail = '/schools/{id}';
  static const String schoolsStudents = '/schools/{id}/students';
  static const String schoolsTeachers = '/schools/{id}/teachers';

  // Admin
  static const String admin = '/admin';
  static const String adminUsers = '/admin/users';
  static const String adminContent = '/admin/content';
  static const String adminReports = '/admin/reports';
  static const String adminSettings = '/admin/settings';

  // Certificates
  static const String certificates = '/certificates';
  static const String certificatesVerify = '/certificates/verify';
}
