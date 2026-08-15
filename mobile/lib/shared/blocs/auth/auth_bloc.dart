import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/constants/app_enums.dart';
import '../models/user/user_model.dart';
import '../services/auth/auth_service.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final User? user;
  final String? error;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.user,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    User? user,
    String? error,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      user: user ?? this.user,
      error: error ?? this.error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;

  AuthNotifier(this._authService) : super(const AuthState());

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true);
    // Check if user is already authenticated
    state = state.copyWith(isLoading: false);
  }

  Future<void> login({
    required String email,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _authService.login(email: email, password: password);
      if (response.success && response.data != null) {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: User.fromJson(response.data!['user'] ?? {}),
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Login failed',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required UserRole role,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _authService.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        role: role.name,
      );
      if (response.success && response.data != null) {
        state = state.copyWith(
          isLoading: false,
          isAuthenticated: true,
          user: User.fromJson(response.data!['user'] ?? {}),
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          error: response.message ?? 'Registration failed',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _authService.logout();
      state = const AuthState();
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true);
    try {
      final response = await _authService.updateProfile(data);
      if (response.success && response.data != null) {
        state = state.copyWith(
          isLoading: false,
          user: User.fromJson(response.data!),
        );
      } else {
        state = state.copyWith(isLoading: false, error: response.message);
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final authService = ref.watch(authServiceProvider);
  return AuthNotifier(authService);
});
