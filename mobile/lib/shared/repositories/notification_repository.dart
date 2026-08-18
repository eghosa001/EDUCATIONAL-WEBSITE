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
    return response.data['data'] as Map<String, dynamic>;
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
}

final notificationRepositoryProvider = Provider<NotificationRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return NotificationRepository(apiClient);
});
