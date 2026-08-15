import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/storage/storage_service.dart';
import '../../core/security/security_service.dart';
import '../services/api/index.dart';
import '../services/auth/auth_service.dart';
import '../services/notifications/notification_service.dart';
import '../services/ai/ai_service.dart';
import '../services/analytics/analytics_service.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

final securityServiceProvider = Provider<SecurityService>((ref) {
  return SecurityService();
});

final authServiceProvider = Provider<AuthService>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthService(client: client);
});

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

final aiServiceProvider = Provider<AIService>((ref) {
  final client = ref.watch(apiClientProvider);
  return AIService(client: client);
});

final analyticsServiceProvider = Provider<AnalyticsService>((ref) {
  final client = ref.watch(apiClientProvider);
  return AnalyticsService(client: client);
});

final authStateProvider = StateProvider<bool>((ref) => false);

final userProvider = StateProvider<Map<String, dynamic>?>((ref) => null);

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);

final languageProvider = StateProvider<String>((ref) => 'en');
