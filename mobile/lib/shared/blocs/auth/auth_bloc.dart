import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_enums.dart';
import '../../models/user/user_model.dart';
import '../../repositories/authentication_repository.dart';

class AuthState {
  final bool isLoading;
  final bool isAuthenticated;
  final bool requiresEmailVerification;
  final User? user;
  final String? pendingEmail;
  final String? error;

  const AuthState({
    this.isLoading = false,
    this.isAuthenticated = false,
    this.requiresEmailVerification = false,
    this.user,
    this.pendingEmail,
    this.error,
  });

  AuthState copyWith({
    bool? isLoading,
    bool? isAuthenticated,
    bool? requiresEmailVerification,
    User? user,
    String? pendingEmail,
    String? error,
    bool clearError = false,
    bool clearPendingEmail = false,
  }) {
    return AuthState(
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      requiresEmailVerification: requiresEmailVerification ?? this.requiresEmailVerification,
      user: user ?? this.user,
      pendingEmail: clearPendingEmail ? null : (pendingEmail ?? this.pendingEmail),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthenticationRepository _repository;

  AuthNotifier(this._repository) : super(const AuthState());

  Future<void> checkAuthStatus() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final profile = await _repository.getProfile();
      final rawUser = profile['user'] is Map ? profile['user'] : profile;
      state = AuthState(
        isAuthenticated: true,
        user: User.fromJson(Map<String, dynamic>.from(rawUser as Map)),
      );
    } catch (_) {
      state = const AuthState();
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _repository.login(email: email, password: password);
      final rawUser = data['user'];
      if (rawUser is! Map) throw StateError('Login response did not include a user');
      state = AuthState(
        isAuthenticated: true,
        user: User.fromJson(Map<String, dynamic>.from(rawUser)),
      );
    } catch (e) {
      state = AuthState(error: e.toString());
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required UserRole role,
  }) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final data = await _repository.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        role: role.name,
      );
      final requiresVerification = data['requiresEmailVerification'] == true || data['tokens'] == null;
      final rawUser = data['user'];

      if (requiresVerification) {
        state = AuthState(
          requiresEmailVerification: true,
          pendingEmail: email.trim().toLowerCase(),
        );
        return;
      }

      if (rawUser is! Map) throw StateError('Registration response did not include a user');
      state = AuthState(
        isAuthenticated: true,
        user: User.fromJson(Map<String, dynamic>.from(rawUser)),
      );
    } catch (e) {
      state = AuthState(error: e.toString());
    }
  }

  Future<void> logout() async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      await _repository.logout();
      state = const AuthState();
    } catch (e) {
      state = AuthState(error: e.toString());
    }
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, clearError: true);
    try {
      final profile = await _repository.updateProfile(data);
      final rawUser = profile['user'] is Map ? profile['user'] : profile;
      state = AuthState(
        isAuthenticated: true,
        user: User.fromJson(Map<String, dynamic>.from(rawUser as Map)),
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }
}

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authenticationRepositoryProvider);
  return AuthNotifier(repository);
});
