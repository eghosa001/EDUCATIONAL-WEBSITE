class ApiConfig {
  static const String baseUrl = 'http://localhost:3000/api/v1';
  static const Duration timeout = Duration(seconds: 10);
  static const String contentType = 'application/json';

  static Map<String, String> get headers => {
    'Content-Type': contentType,
  };

  static Map<String, String> getAuthHeaders(String? token) {
    final headers = <String, String>{'Content-Type': contentType};
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }
}

class ApiException implements Exception {
  final int? statusCode;
  final String message;
  final dynamic data;

  const ApiException({
    this.statusCode,
    required this.message,
    this.data,
  });

  @override
  String toString() {
    return 'ApiException: $message (Status: $statusCode)';
  }
}

class ApiResponse<T> {
  final T? data;
  final String? message;
  final bool success;

  const ApiResponse({
    this.data,
    this.message,
    this.success = true,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json, {
    T Function(Map<String, dynamic>)? fromJson,
  }) {
    return ApiResponse<T>(
      data: fromJson != null ? fromJson(json['data'] ?? {}) : json['data'] as T?,
      message: json['message'] as String?,
      success: json['success'] as bool? ?? true,
    );
  }
}

class PaginatedResponse<T> {
  final List<T> data;
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  const PaginatedResponse({
    required this.data,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json, {
    required T Function(Map<String, dynamic>) fromJson,
  }) {
    final pagination = json['pagination'] as Map<String, dynamic>? ?? {};
    return PaginatedResponse<T>(
      data: (json['data'] as List<dynamic>? ?? [])
          .map((item) => fromJson(item as Map<String, dynamic>))
          .toList(),
      page: pagination['page'] as int? ?? 1,
      limit: pagination['limit'] as int? ?? 20,
      total: pagination['total'] as int? ?? 0,
      totalPages: pagination['totalPages'] as int? ?? 0,
    );
  }
}
