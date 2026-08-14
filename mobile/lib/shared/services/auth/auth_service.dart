import '../api/api_client.dart';
import '../api/api_config.dart';

class AuthService {
  final ApiClient _client;

  AuthService({ApiClient? client}) : _client = client ?? ApiClient();

  // Login
  Future<ApiResponse<Map<String, dynamic>>> login({
    required String email,
    required String password,
  }) async {
    return _client.post<Map<String, dynamic>>(
      '/auth/login',
      body: {'email': email, 'password': password},
    );
  }

  // Register
  Future<ApiResponse<Map<String, dynamic>>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
  }) async {
    return _client.post<Map<String, dynamic>>(
      '/auth/register',
      body: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
      },
    );
  }

  // Logout
  Future<ApiResponse<void>> logout() async {
    return _client.post<void>('/auth/logout');
  }

  // Refresh Token
  Future<ApiResponse<Map<String, dynamic>>> refreshToken(String refreshToken) async {
    return _client.post<Map<String, dynamic>>(
      '/auth/refresh',
      body: {'refreshToken': refreshToken},
    );
  }

  // Forgot Password
  Future<ApiResponse<void>> forgotPassword(String email) async {
    return _client.post<void>(
      '/auth/forgot-password',
      body: {'email': email},
    );
  }

  // Reset Password
  Future<ApiResponse<void>> resetPassword({
    required String token,
    required String password,
    required String confirmPassword,
  }) async {
    return _client.post<void>(
      '/auth/reset-password',
      body: {
        'token': token,
        'password': password,
        'confirmPassword': confirmPassword,
      },
    );
  }

  // Change Password
  Future<ApiResponse<void>> changePassword({
    required String currentPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    return _client.post<void>(
      '/auth/change-password',
      body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      },
    );
  }

  // Verify Email
  Future<ApiResponse<void>> verifyEmail(String token) async {
    return _client.post<void>(
      '/auth/verify-email',
      body: {'token': token},
    );
  }

  // Resend Verification Email
  Future<ApiResponse<void>> resendVerificationEmail(String email) async {
    return _client.post<void>(
      '/auth/resend-verification',
      body: {'email': email},
    );
  }
}
