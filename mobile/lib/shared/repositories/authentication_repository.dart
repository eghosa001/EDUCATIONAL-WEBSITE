import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';
import '../../core/storage/storage_service.dart';

class AuthenticationRepository {
  final ApiClient _apiClient;
  final StorageService _storage;

  AuthenticationRepository(this._apiClient, this._storage);

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
    bool rememberMe = false,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppEndpoints.login,
      data: {'email': email, 'password': password, 'rememberMe': rememberMe},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    if (data['token'] != null) {
      _storage.saveToken(data['token']);
      _storage.saveUser(data['user'] ?? {});
    }
    return data;
  }

  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
    String? role = 'student',
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppEndpoints.register,
      data: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'phone': phone,
        'role': role,
      },
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(AppEndpoints.logout);
    } finally {
      _storage.clearAuth();
    }
  }

  Future<Map<String, dynamic>> verifyEmail({required String token}) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppEndpoints.verifyEmail,
      data: {'token': token},
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> forgotPassword({required String email}) async {
    await _apiClient.post(
      AppEndpoints.forgotPassword,
      data: {'email': email},
    );
  }

  Future<void> resetPassword({
    required String token,
    required String password,
  }) async {
    await _apiClient.post(
      AppEndpoints.resetPassword,
      data: {'token': token, 'password': password},
    );
  }

  Future<Map<String, dynamic>> getProfile() async {
    final response = await _apiClient.get<Map<String, dynamic>>(AppEndpoints.usersProfile);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }
}

final authenticationRepositoryProvider = Provider((ref) {
  final apiClient = ref.read(apiClientProvider);
  final storage = ref.read(storageServiceProvider);
  return AuthenticationRepository(apiClient, storage);
});
