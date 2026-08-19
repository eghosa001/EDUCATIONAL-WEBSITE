import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/storage_service.dart';
import '../../core/security/security_service.dart';
import '../../shared/services/auth/auth_service.dart';
import '../../shared/services/notifications/notification_service.dart';
import '../../shared/services/analytics/analytics_service.dart';
import '../../shared/services/ai_tutor_service.dart';
import '../../shared/repositories/course_repository.dart';
import '../../shared/repositories/lesson_repository.dart';
import '../../shared/repositories/exam_repository.dart';
import '../../shared/repositories/library_repository.dart';
import '../../shared/repositories/progress_repository.dart';
import '../../shared/repositories/gamification_repository.dart';
import '../../shared/repositories/live_class_repository.dart';
import '../../shared/repositories/ai_tutor_repository.dart';
import '../../shared/repositories/notification_repository.dart';
import '../../shared/repositories/question_repository.dart';
import '../../shared/repositories/community_repository.dart';
import '../../shared/repositories/parent_repository.dart';
import '../../shared/repositories/teacher_repository.dart';
import '../../shared/repositories/school_repository.dart';

// Core infrastructure
final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());
final storageServiceProvider = Provider<StorageService>((ref) => StorageService());
final securityServiceProvider = Provider<SecurityService>((ref) => SecurityService());

// AI Service
final aiTutorServiceProvider = Provider<AiTutorService>((ref) => AiTutorService());
final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  final client = ref.watch(apiClientProvider);
  return AnalyticsService(client: client);
});

// Auth & Notifications
final authServiceProvider = Provider<AuthService>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthService(client: client);
});
final notificationServiceProvider = Provider<NotificationService>((ref) {
  final client = ref.watch(apiClientProvider);
  return NotificationService(client: client);
});

// Repositories
final courseRepositoryProvider = Provider<CourseRepository>((ref) {
  return CourseRepository(ref.watch(apiClientProvider));
});
final lessonRepositoryProvider = Provider<LessonRepository>((ref) {
  return LessonRepository(ref.watch(apiClientProvider));
});
final examRepositoryProvider = Provider<ExamRepository>((ref) {
  return ExamRepository(ref.watch(apiClientProvider));
});
final libraryRepositoryProvider = Provider<LibraryRepository>((ref) {
  return LibraryRepository(ref.watch(apiClientProvider));
});
final progressRepositoryProvider = Provider<ProgressRepository>((ref) {
  return ProgressRepository(ref.watch(apiClientProvider));
});
final gamificationRepositoryProvider = Provider<GamificationRepository>((ref) {
  return GamificationRepository(ref.watch(apiClientProvider));
});
final liveClassRepositoryProvider = Provider<LiveClassRepository>((ref) {
  return LiveClassRepository(ref.watch(apiClientProvider));
});
final aiTutorRepositoryProvider = Provider<AiTutorRepository>((ref) {
  return AiTutorRepository(
    service: ref.watch(aiTutorServiceProvider),
    storage: ref.watch(storageServiceProvider),
  );
});
final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  return NotificationRepository(ref.watch(apiClientProvider));
});
final questionRepositoryProvider = Provider<QuestionRepository>((ref) {
  return QuestionRepository(ref.watch(apiClientProvider));
});
final communityRepositoryProvider = Provider<CommunityRepository>((ref) {
  return CommunityRepository(ref.watch(apiClientProvider));
});
final parentRepositoryProvider = Provider<ParentRepository>((ref) {
  return ParentRepository(ref.watch(apiClientProvider));
});
final teacherRepositoryProvider = Provider<TeacherRepository>((ref) {
  return TeacherRepository(ref.watch(apiClientProvider));
});
final schoolRepositoryProvider = Provider<SchoolRepository>((ref) {
  return SchoolRepository(ref.watch(apiClientProvider));
});

// Auth state
final authStateProvider = StateProvider<bool>((ref) => false);
final userProvider = StateProvider<Map<String, dynamic>?>((ref) => null);
final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);
final languageProvider = StateProvider<String>((ref) => 'en');
