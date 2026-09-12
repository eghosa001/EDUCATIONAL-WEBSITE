import 'package:dio/dio.dart';
import '../api/api_client.dart';

// Compatibility wrapper for older callers. New auth state uses
// AuthenticationRepository, but this service remains type-correct for any
// feature that imports it directly.
class AuthService {
  final ApiClient _client;

  AuthService({ApiClient? client}) : _client = client ?? ApiClient();

  Future<Response<Map<String, dynamic>>> login({
    required String email,
    required String password,
  }) {
    return _client.post<Map<String, dynamic>>(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
  }

  Future<Response<Map<String, dynamic>>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
  }) {
    return _client.post<Map<String, dynamic>>(
      '/auth/register',
      data: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
      },
    );
  }

  Future<Response<dynamic>> logout() => _client.post('/auth/logout');

  Future<Response<Map<String, dynamic>>> refreshToken(String refreshToken) {
    return _client.post<Map<String, dynamic>>(
      '/auth/refresh',
      data: {'refreshToken': refreshToken},
    );
  }

  Future<Response<dynamic>> forgotPassword(String email) {
    return _client.post('/auth/forgot-password', data: {'email': email});
  }

  Future<Response<dynamic>> resetPassword({
    required String token,
    required String password,
    String? confirmPassword,
  }) {
    return _client.post(
      '/auth/reset-password',
      data: {'token': token, 'password': password},
    );
  }

  Future<Response<dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
    String? confirmPassword,
  }) {
    return _client.post(
      '/auth/change-password',
      data: {'currentPassword': currentPassword, 'newPassword': newPassword},
    );
  }

  Future<Response<dynamic>> verifyEmail(String token) {
    return _client.post('/auth/verify-email', data: {'token': token});
  }

  Future<Response<dynamic>> resendVerificationEmail(String email) {
    return _client.post('/auth/resend-verification', data: {'email': email});
  }
}
