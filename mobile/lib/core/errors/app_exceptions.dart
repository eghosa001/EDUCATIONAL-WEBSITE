class AppException implements Exception {
  final String message;
  final String? code;
  final dynamic details;

  const AppException({
    required this.message,
    this.code,
    this.details,
  });

  @override
  String toString() => code != null ? '[$code] $message' : message;
}

class AuthenticationException extends AppException {
  const AuthenticationException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class AuthorizationException extends AppException {
  const AuthorizationException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class NetworkException extends AppException {
  const NetworkException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class ServerException extends AppException {
  const ServerException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class ValidationException extends AppException {
  const ValidationException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class TimeoutException extends AppException {
  const TimeoutException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class CacheException extends AppException {
  const CacheException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class StorageException extends AppException {
  const StorageException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class PermissionException extends AppException {
  const PermissionException({
    required String message,
    String? code,
    dynamic details,
  }) : super(message: message, code: code, details: details);
}

class AppExceptionMapper {
  static AppException map(dynamic error) {
    if (error is AppException) return error;

    final errorMessage = error?.toString() ?? 'An unexpected error occurred';

    if (errorMessage.contains('authentication') || errorMessage.contains('unauthorized') || errorMessage.contains('401')) {
      return AuthenticationException(message: errorMessage);
    }
    if (errorMessage.contains('authorization') || errorMessage.contains('forbidden') || errorMessage.contains('403')) {
      return AuthorizationException(message: errorMessage);
    }
    if (errorMessage.contains('network') || errorMessage.contains('connection') || errorMessage.contains('timeout')) {
      return NetworkException(message: errorMessage);
    }
    if (errorMessage.contains('server') || errorMessage.contains('500')) {
      return ServerException(message: errorMessage);
    }
    if (errorMessage.contains('validation') || errorMessage.contains('invalid')) {
      return ValidationException(message: errorMessage);
    }
    if (errorMessage.contains('cache')) {
      return CacheException(message: errorMessage);
    }
    if (errorMessage.contains('storage')) {
      return StorageException(message: errorMessage);
    }
    if (errorMessage.contains('permission')) {
      return PermissionException(message: errorMessage);
    }

    return AppException(message: errorMessage);
  }
}
