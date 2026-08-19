import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class NotificationRepository {
  final ApiClient _apiClient;

  NotificationRepository(this._apiClient);

  Future<Map<String, dynamic>> getNotifications({
    int page = 1,
    int limit = 20,
    bool? unreadOnly,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.notifications,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (unreadOnly != null) 'unreadOnly': unreadOnly,
      },
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    return {
      'notifications': data['notifications'] ?? [],
      'unreadCount': data['unreadCount'] as int? ?? 0,
      'pagination': data['pagination'] as Map<String, dynamic>? ?? {},
    };
  }

  Future<int> getUnreadCount() async {
    final response = await _apiClient.dio.get(
      AppEndpoints.notifications,
      queryParameters: {'unreadOnly': true, 'limit': 1},
    );
    final data = response.data['data'] as Map<String, dynamic>?;
    return data?['unreadCount'] as int? ?? 0;
  }

  Future<void> markAsRead(String notificationId) async {
    await _apiClient.dio.patch(
      AppEndpoints.notificationsMarkRead.replaceFirst('{id}', notificationId),
    );
  }

  Future<void> markAllAsRead() async {
    await _apiClient.dio.post(AppEndpoints.notificationsMarkAllRead);
  }

  Future<void> deleteNotification(String notificationId) async {
    await _apiClient.dio.delete(
      '${AppEndpoints.notifications}/${notificationId}',
    );
  }

  Future<void> registerDevice({
    required String platform,
    required String fcmToken,
    String? deviceToken,
    String? appVersion,
  }) async {
    await _apiClient.dio.post(
      AppEndpoints.notificationsRegisterDevice,
      data: {
        'platform': platform,
        'fcmToken': fcmToken,
        'deviceToken': deviceToken,
        'appVersion': appVersion,
      },
    );
  }

  Future<void> unregisterDevice(String fcmToken) async {
    await _apiClient.dio.delete(
      AppEndpoints.notificationsRegisterDevice.replace('register', 'unregister'),
      data: {'fcmToken': fcmToken},
    );
  }

  Future<Map<String, dynamic>> getPreferences() async {
    final response = await _apiClient.dio.get(AppEndpoints.notificationsPreferences);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> updatePreference({
    required String channel,
    required String notificationType,
    required bool isEnabled,
  }) async {
    await _apiClient.dio.patch(
      AppEndpoints.notificationsPreferences,
      data: {
        'channel': channel,
        'notificationType': notificationType,
        'isEnabled': isEnabled,
      },
    );
  }
}

