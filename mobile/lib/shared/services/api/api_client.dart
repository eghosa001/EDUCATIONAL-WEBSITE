import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_config.dart';

class ApiClient {
  final String baseUrl;
  final Duration timeout;
  String? _token;

  ApiClient({
    this.baseUrl = ApiConfig.baseUrl,
    this.timeout = ApiConfig.timeout,
  });

  String? get token => _token;

  set token(String? newToken) {
    _token = newToken;
  }

  Future<Map<String, String>> _getHeaders() async {
    return ApiConfig.getAuthHeaders(_token);
  }

  Future<http.Response> _request(
    String method,
    String path, {
    dynamic body,
    Map<String, String>? headers,
    Map<String, dynamic>? queryParams,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final requestHeaders = {
      ...ApiConfig.headers,
      ...?headers,
      ...await _getHeaders(),
    };

    final requestUri = queryParams != null && queryParams.isNotEmpty
        ? uri.replace(queryParameters: queryParams)
        : uri;

    final requestBody = body != null ? jsonEncode(body) : null;

    final request = http
        .Request(method, requestUri)
        ..headers.addAll(requestHeaders)
        ..body = requestBody;

    final response = await request.timeout(timeout).send();
    return http.Response.fromStream(response);

    return response;
  }

  Future<ApiResponse<T>> _handleResponse<T>(
    http.Response response, {
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final statusCode = response.statusCode;
    final body = response.body;

    if (statusCode >= 200 && statusCode < 300) {
      try {
        final json = jsonDecode(body) as Map<String, dynamic>;
        return ApiResponse<T>(
          data: fromJson != null
              ? fromJson(json['data'] ?? {})
              : json['data'] as T?,
          message: json['message'] as String?,
          success: json['success'] as bool? ?? true,
        );
      } catch (e) {
        throw ApiException(
          statusCode: statusCode,
          message: 'Failed to parse response',
          data: body,
        );
      }
    } else {
      try {
        final json = jsonDecode(body) as Map<String, dynamic>;
        throw ApiException(
          statusCode: statusCode,
          message: json['message'] as String? ?? 'Request failed',
          data: json,
        );
      } catch (e) {
        throw ApiException(
          statusCode: statusCode,
          message: 'Request failed with status $statusCode',
          data: body,
        );
      }
    }
  }

  // GET request
  Future<ApiResponse<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParams,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _request('GET', path, queryParams: queryParams);
    return _handleResponse<T>(response, fromJson: fromJson);
  }

  // POST request
  Future<ApiResponse<T>> post<T>(
    String path, {
    dynamic body,
    Map<String, dynamic>? queryParams,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _request('POST', path, body: body, queryParams: queryParams);
    return _handleResponse<T>(response, fromJson: fromJson);
  }

  // PATCH request
  Future<ApiResponse<T>> patch<T>(
    String path, {
    dynamic body,
    Map<String, dynamic>? queryParams,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _request('PATCH', path, body: body, queryParams: queryParams);
    return _handleResponse<T>(response, fromJson: fromJson);
  }

  // PUT request
  Future<ApiResponse<T>> put<T>(
    String path, {
    dynamic body,
    Map<String, dynamic>? queryParams,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _request('PUT', path, body: body, queryParams: queryParams);
    return _handleResponse<T>(response, fromJson: fromJson);
  }

  // DELETE request
  Future<ApiResponse<T>> delete<T>(
    String path, {
    dynamic body,
    Map<String, dynamic>? queryParams,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final response = await _request('DELETE', path, body: body, queryParams: queryParams);
    return _handleResponse<T>(response, fromJson: fromJson);
  }

  // Upload file
  Future<ApiResponse<T>> uploadFile<T>(
    String path, {
    required String filePath,
    required String fieldName,
    Map<String, String>? extraFields,
    T Function(Map<String, dynamic>)? fromJson,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final request = http.MultipartRequest('POST', uri);

    request.headers.addAll(await _getHeaders());

    if (extraFields != null) {
      extraFields.forEach((key, value) {
        request.fields[key] = value;
      });
    }

    request.files.add(
      await http.MultipartFile.fromPath(
        fieldName,
        filePath,
      ),
    );

    final response = await request.send().timeout(timeout);
    final responseBody = await response.stream.bytesToString();

    if (response.statusCode >= 200 && response.statusCode < 300) {
      try {
        final json = jsonDecode(responseBody) as Map<String, dynamic>;
        return ApiResponse<T>(
          data: fromJson != null
              ? fromJson(json['data'] ?? {})
              : json['data'] as T?,
          message: json['message'] as String?,
          success: json['success'] as bool? ?? true,
        );
      } catch (e) {
        throw ApiException(
          statusCode: response.statusCode,
          message: 'Failed to parse response',
          data: responseBody,
        );
      }
    } else {
      throw ApiException(
        statusCode: response.statusCode,
        message: 'File upload failed',
        data: responseBody,
      );
    }
  }
}
