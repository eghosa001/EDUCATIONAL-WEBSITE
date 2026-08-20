/// Analytics service for tracking user behavior and platform metrics
/// Sends events to the backend for centralized analytics storage

import '../../../core/network/api_client.dart';
import '../../../core/constants/app_endpoints.dart';
import '../../../core/storage/storage_service.dart';

class AnalyticsService {
  final ApiClient _apiClient;
  final StorageService _storage;

  AnalyticsService({required ApiClient apiClient, required StorageService storage})
      : _apiClient = apiClient,
        _storage = storage;

  Future<void> trackScreenView(String screenName) async {
    final token = _storage.token;
    if (token == null || token.isEmpty) return;
    try {
      await _apiClient.post(
        '/analytics/events',
        data: {
          'type': 'screen_view',
          'screenName': screenName,
          'userId': _storage.userId,
        },
      );
    } catch (e) {
      // Silently fail — analytics should never break the app
    }
  }

  Future<void> trackEvent({
    required String eventName,
    Map<String, dynamic>? parameters,
  }) async {
    final token = _storage.token;
    if (token == null || token.isEmpty) return;
    try {
      await _apiClient.post(
        '/analytics/events',
        data: {
          'type': 'event',
          'eventName': eventName,
          'parameters': parameters ?? {},
          'userId': _storage.userId,
        },
      );
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> setUserProperties(Map<String, dynamic> properties) async {
    final token = _storage.token;
    if (token == null || token.isEmpty) return;
    try {
      await _apiClient.patch(
        '/analytics/user-properties',
        data: {'properties': properties},
      );
    } catch (e) {
      // Silently fail
    }
  }

  Future<void> trackLogin(String userId) async {
    await trackEvent(eventName: 'user_login', parameters: {'user_id': userId});
  }

  Future<void> trackCourseEnrollment({
    required String userId,
    required String courseId,
  }) async {
    await trackEvent(
      eventName: 'course_enrollment',
      parameters: {'user_id': userId, 'course_id': courseId},
    );
  }

  Future<void> trackLessonCompletion({
    required String userId,
    required String lessonId,
    required String courseId,
  }) async {
    await trackEvent(
      eventName: 'lesson_completion',
      parameters: {'user_id': userId, 'lesson_id': lessonId, 'course_id': courseId},
    );
  }

  Future<void> trackExamAttempt({
    required String userId,
    required String examId,
    required double score,
    required bool passed,
  }) async {
    await trackEvent(
      eventName: 'exam_attempt',
      parameters: {'user_id': userId, 'exam_id': examId, 'score': score, 'passed': passed},
    );
  }

  Future<void> trackSubscription({
    required String userId,
    required String planId,
    required double amount,
  }) async {
    await trackEvent(
      eventName: 'subscription',
      parameters: {'user_id': userId, 'plan_id': planId, 'amount': amount},
    );
  }

  Future<void> trackPayment({
    required String userId,
    required double amount,
    required String method,
    required bool success,
  }) async {
    await trackEvent(
      eventName: 'payment',
      parameters: {'user_id': userId, 'amount': amount, 'method': method, 'success': success},
    );
  }
}
