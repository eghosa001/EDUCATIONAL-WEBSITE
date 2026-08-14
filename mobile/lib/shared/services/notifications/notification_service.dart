import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'notification_service.g.dart';

@JsonSerializable()
class Notification {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type;
  final Map<String, dynamic>? data;
  final bool isRead;
  final String createdAt;

  const Notification({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    this.data,
    required this.isRead,
    required this.createdAt,
  });

  factory Notification.fromJson(Map<String, dynamic> json) => _$NotificationFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationToJson(this);
}

@JsonSerializable()
class NotificationPreferences {
  final bool email;
  final bool push;
  final bool sms;
  final bool examReminders;
  final bool courseUpdates;
  final bool promotional;

  const NotificationPreferences({
    required this.email,
    required this.push,
    required this.sms,
    required this.examReminders,
    required this.courseUpdates,
    required this.promotional,
  });

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) => _$NotificationPreferencesFromJson(json);
  Map<String, dynamic> toJson() => _$NotificationPreferencesToJson(this);
}

class NotificationService {
  final ApiClient _client;

  NotificationService({ApiClient? client}) : _client = client ?? ApiClient();

  // List notifications
  Future<ApiResponse<List<Notification>>> listNotifications({
    int page = 1,
    int limit = 20,
    bool? isRead,
    String? type,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (isRead != null) queryParams['isRead'] = isRead;
    if (type != null) queryParams['type'] = type;

    return _client.get<List<Notification>>(
      '/notifications',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Notification.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get unread notifications
  Future<ApiResponse<Map<String, dynamic>>> getUnreadNotifications() async {
    return _client.get<Map<String, dynamic>>('/notifications/unread');
  }

  // Mark notification as read
  Future<ApiResponse<void>> markNotificationAsRead(String notificationId) async {
    return _client.post<void>('/notifications/$notificationId/read');
  }

  // Mark all notifications as read
  Future<ApiResponse<void>> markAllNotificationsAsRead() async {
    return _client.post<void>('/notifications/read-all');
  }

  // Delete notification
  Future<ApiResponse<void>> deleteNotification(String notificationId) async {
    return _client.delete<void>('/notifications/$notificationId');
  }

  // Delete all notifications
  Future<ApiResponse<void>> deleteAllNotifications() async {
    return _client.delete<void>('/notifications');
  }

  // Get notification preferences
  Future<ApiResponse<NotificationPreferences>> getNotificationPreferences() async {
    return _client.get<NotificationPreferences>(
      '/notifications/preferences',
      fromJson: NotificationPreferences.fromJson,
    );
  }

  // Update notification preferences
  Future<ApiResponse<NotificationPreferences>> updateNotificationPreferences(
    NotificationPreferences preferences,
  ) async {
    return _client.patch<NotificationPreferences>(
      '/notifications/preferences',
      body: preferences.toJson(),
      fromJson: NotificationPreferences.fromJson,
    );
  }
}
