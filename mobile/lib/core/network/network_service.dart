import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../config/app_config.dart';
import '../storage/storage_service.dart';

class NetworkService {
  static final NetworkService _instance = NetworkService._internal();
  factory NetworkService() => _instance;
  NetworkService._internal();

  late Dio _dio;
  final StorageService _storage = StorageService();

  Dio get dio => _dio;

  Future<void> initialize() async {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        responseType: ResponseType.json,
        validateStatus: (status) => status != null && status >= 200 && status < 400,
      ),
    );

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.readToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        options.headers['Content-Type'] = 'application/json';
        options.headers['Accept'] = 'application/json';
        handler.next(options);
      },
      onResponse: (response, handler) async {
        await _persistAuthPayload(response.data);
        handler.next(response);
      },
      onError: (DioException error, handler) async {
        final request = error.requestOptions;
        final isRefreshRequest = request.path.endsWith('/auth/refresh');
        final alreadyRetried = request.extra['authRetried'] == true;

        if (error.response?.statusCode == 401 && !isRefreshRequest && !alreadyRetried) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final token = await _storage.readToken();
            request.extra['authRetried'] = true;
            if (token != null && token.isNotEmpty) {
              request.headers['Authorization'] = 'Bearer $token';
            }
            try {
              final retryResponse = await _dio.fetch(request);
              return handler.resolve(retryResponse);
            } on DioException catch (retryError) {
              return handler.next(retryError);
            }
          }
          await _storage.clearAuth();
        }
        handler.next(error);
      },
    ));

    // Never log auth headers, passwords, request bodies, or response payloads.
    // URL/status logging is useful in development without leaking credentials.
    if (kDebugMode) {
      _dio.interceptors.add(PrettyDioLogger(
        requestHeader: false,
        requestBody: false,
        responseHeader: false,
        responseBody: false,
        error: true,
        compact: true,
      ));
    }
  }

  Future<void> _persistAuthPayload(dynamic payload) async {
    if (payload is! Map) return;
    final envelope = Map<String, dynamic>.from(payload);
    final rawData = envelope['data'];
    if (rawData is! Map) return;
    final data = Map<String, dynamic>.from(rawData);

    final rawTokens = data['tokens'];
    if (rawTokens is Map) {
      final tokens = Map<String, dynamic>.from(rawTokens);
      final accessToken = tokens['accessToken']?.toString();
      final refreshToken = tokens['refreshToken']?.toString();
      if (accessToken != null && accessToken.isNotEmpty) {
        await _storage.saveToken(accessToken);
      }
      if (refreshToken != null && refreshToken.isNotEmpty) {
        await _storage.saveRefreshToken(refreshToken);
      }
    }

    final rawUser = data['user'];
    if (rawUser is Map) {
      await _storage.saveUser(Map<String, dynamic>.from(rawUser));
    }
  }

  Future<bool> _refreshToken() async {
    final refreshToken = await _storage.readRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    try {
      // Use a bare Dio instance so a failed refresh cannot recursively invoke
      // the normal 401 interceptor.
      final refreshClient = Dio(
        BaseOptions(
          baseUrl: AppConfig.apiBaseUrl,
          connectTimeout: const Duration(seconds: 30),
          receiveTimeout: const Duration(seconds: 30),
          responseType: ResponseType.json,
          validateStatus: (status) => status != null && status >= 200 && status < 400,
          headers: const {'Content-Type': 'application/json', 'Accept': 'application/json'},
        ),
      );
      final response = await refreshClient.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      await _persistAuthPayload(response.data);
      return (await _storage.readToken())?.isNotEmpty == true;
    } catch (_) {
      return false;
    }
  }
}
