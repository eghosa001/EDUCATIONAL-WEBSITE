import 'package:dio/dio.dart';
import 'network_service.dart';
import 'error_handler.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  final NetworkService _networkService = NetworkService();

  Future<void> initialize() async {
    await _networkService.initialize();
  }

  NetworkService get networkService => _networkService;

  Dio get dio => _networkService.dio;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await dio.get<T>(path, queryParameters: queryParameters, options: options);
    } catch (e) {
      throw ApiErrorHandler.handle(e);
    }
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
    } catch (e) {
      throw ApiErrorHandler.handle(e);
    }
  }

  Future<Response<T>> patch<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await dio.patch<T>(path, data: data, options: options);
    } catch (e) {
      throw ApiErrorHandler.handle(e);
    }
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      return await dio.put<T>(path, data: data, options: options);
    } catch (e) {
      throw ApiErrorHandler.handle(e);
    }
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      return await dio.delete<T>(path, data: data, options: options, cancelToken: cancelToken);
    } catch (e) {
      throw ApiErrorHandler.handle(e);
    }
  }

  Future<Response> uploadFile<T>(
    String path, {
    required String fieldName,
    required String filePath,
    Map<String, dynamic>? data,
  }) async {
    try {
      final formData = FormData();
      formData.addField('fieldName', fieldName);
      formData.files.add(MapEntry(
        fieldName,
        await MultipartFile.fromFile(filePath),
      ));
      if (data != null) {
        data.forEach((key, value) {
          formData.addField(key, value.toString());
        });
      }
      return await dio.post(path, data: formData);
    } catch (e) {
      throw ApiErrorHandler.handle(e);
    }
  }
}
