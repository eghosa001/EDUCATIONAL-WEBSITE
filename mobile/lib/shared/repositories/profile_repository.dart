import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';
import '../../core/storage/storage_service.dart';

class ProfileRepository {
  final ApiClient _apiClient;
  final StorageService _storage;

  ProfileRepository(this._apiClient, this._storage);

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _apiClient.get<Map<String, dynamic>>(AppEndpoints.usersProfile);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? bio,
  }) async {
    await _apiClient.patch(
      AppEndpoints.usersUpdate,
      data: {
        if (firstName != null) 'firstName': firstName,
        if (lastName != null) 'lastName': lastName,
        if (phone != null) 'phone': phone,
        if (bio != null) 'bio': bio,
      },
    );
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _apiClient.post(
      AppEndpoints.changePassword,
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );
  }

  Future<Map<String, dynamic>> getNotificationPreferences() async {
    final response = await _apiClient.get<Map<String, dynamic>>(AppEndpoints.notificationsPreferences);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> updateNotificationPreferences(Map<String, dynamic> preferences) async {
    await _apiClient.patch(
      AppEndpoints.notificationsPreferences,
      data: preferences,
    );
  }

  Future<void> uploadAvatar(String fileUrl) async {
    await _apiClient.post(
      '/users/avatar',
      data: {'url': fileUrl},
    );
  }
}

final profileRepositoryProvider = Provider((ref) {
  final apiClient = ref.read(apiClientProvider);
  final storage = ref.read(storageServiceProvider);
  return ProfileRepository(apiClient, storage);
});
