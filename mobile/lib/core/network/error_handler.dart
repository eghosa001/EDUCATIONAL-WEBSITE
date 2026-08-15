import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'network_service.dart';

class NetworkError implements Exception {
  final String message;
  final int? statusCode;
  final Map<String, dynamic>? details;

  const NetworkError({
    required this.message,
    this.statusCode,
    this.details,
  });

  factory NetworkError.fromDio(DioException e) {
    String message = 'Network error occurred';
    int? statusCode;
    Map<String, dynamic>? details;

    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      message = 'Connection timeout. Please check your internet connection.';
    } else if (e.type == DioExceptionType.connectionError) {
      message = 'No internet connection. Please try again.';
    } else if (e.response != null) {
      statusCode = e.response!.statusCode;
      final errorData = e.response!.data;
      if (errorData is Map<String, dynamic>) {
        message = errorData['message'] ?? 'Request failed';
        details = errorData;
      } else {
        message = 'Request failed with status $statusCode';
      }
    } else {
      message = e.message ?? 'Unknown error occurred';
    }

    return NetworkError(
      message: message,
      statusCode: statusCode,
      details: details,
    );
  }

  @override
  String toString() => message;
}

class ApiErrorHandler {
  static NetworkError handle(dynamic error) {
    if (error is NetworkError) return error;
    if (error is DioException) return NetworkError.fromDio(error);
    return NetworkError(message: error.toString());
  }

  static void showSnackBar(BuildContext context, dynamic error) {
    final networkError = handle(error);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(networkError.message),
        backgroundColor: Theme.of(context).colorScheme.error,
        duration: const Duration(seconds: 3),
      ),
    );
  }
}
