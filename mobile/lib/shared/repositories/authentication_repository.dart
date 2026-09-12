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
    final data = Map<String, dynamic>.from(response.data?['data'] as Map? ?? const {});
    await _persistAuthData(data);
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
        if (phone != null && phone.isNotEmpty) 'phone': phone,
        'role': role,
      },
    );
    final data = Map<String, dynamic>.from(response.data?['data'] as Map? ?? const {});
    await _persistAuthData(data);
    return data;
  }

  Future<void> _persistAuthData(Map<String, dynamic> data) async {
    final rawTokens = data['tokens'];
    if (rawTokens is Map) {
      final tokens = Map<String, dynamic>.from(rawTokens);
      await _storage.saveToken(tokens['accessToken']?.toString());
      await _storage.saveRefreshToken(tokens['refreshToken']?.toString());
    }
    final rawUser = data['user'];
    if (rawUser is Map) {
      await _storage.saveUser(Map<String, dynamic>.from(rawUser));
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(AppEndpoints.logout);
    } finally {
      await _storage.clearAuth();
    }
  }

  Future<Map<String, dynamic>> verifyEmail({required String token}) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppEndpoints.verifyEmail,
      data: {'token': token},
    );
    return Map<String, dynamic>.from(response.data?['data'] as Map? ?? const {});
  }

  Future<void> resendVerification({required String email}) async {
    await _apiClient.post(
      AppEndpoints.resendVerification,
      data: {'email': email},
    );
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
    final data = Map<String, dynamic>.from(response.data?['data'] as Map? ?? const {});
    final rawUser = data['user'];
    if (rawUser is Map) {
      await _storage.saveUser(Map<String, dynamic>.from(rawUser));
    }
    return data;
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> updates) async {
    await _apiClient.patch<Map<String, dynamic>>(
      AppEndpoints.usersProfile,
      data: updates,
    );
    return getProfile();
  }
}

final authenticationRepositoryProvider = Provider((ref) {
  final apiClient = ref.read(apiClientProvider);
  final storage = ref.read(storageServiceProvider);
  return AuthenticationRepository(apiClient, storage);
});
