import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'user_service.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;
  final String? avatar;
  final String createdAt;
  final String updatedAt;

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
    this.avatar,
    required this.createdAt,
    required this.updatedAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

class UserService {
  final ApiClient _client;

  UserService({ApiClient? client}) : _client = client ?? ApiClient();

  // Get current user profile
  Future<ApiResponse<User>> getMyProfile() async {
    return _client.get<User>('/users/me', fromJson: User.fromJson);
  }

  // Update current user profile
  Future<ApiResponse<User>> updateMyProfile({
    String? firstName,
    String? lastName,
    String? avatar,
    String? bio,
    String? phone,
  }) async {
    final body = <String, dynamic>{};
    if (firstName != null) body['firstName'] = firstName;
    if (lastName != null) body['lastName'] = lastName;
    if (avatar != null) body['avatar'] = avatar;
    if (bio != null) body['bio'] = bio;
    if (phone != null) body['phone'] = phone;

    return _client.patch<User>('/users/me', body: body, fromJson: User.fromJson);
  }

  // Get user by ID
  Future<ApiResponse<User>> getUserById(String userId) async {
    return _client.get<User>('/users/$userId', fromJson: User.fromJson);
  }

  // List users (Admin)
  Future<ApiResponse<List<User>>> listUsers({
    int page = 1,
    int limit = 20,
    String? role,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (role != null) queryParams['role'] = role;
    if (search != null) queryParams['search'] = search;

    return _client.get<List<User>>(
      '/users',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => User.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Update user (Admin)
  Future<ApiResponse<User>> updateUser(
    String userId, {
    String? firstName,
    String? lastName,
    String? avatar,
    String? role,
  }) async {
    final body = <String, dynamic>{};
    if (firstName != null) body['firstName'] = firstName;
    if (lastName != null) body['lastName'] = lastName;
    if (avatar != null) body['avatar'] = avatar;
    if (role != null) body['role'] = role;

    return _client.patch<User>('/users/$userId', body: body, fromJson: User.fromJson);
  }

  // Delete user (Admin)
  Future<ApiResponse<void>> deleteUser(String userId) async {
    return _client.delete<void>('/users/$userId');
  }
}
