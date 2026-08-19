import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class ParentRepository {
  final ApiClient _apiClient;

  ParentRepository(this._apiClient);

  Future<Map<String, dynamic>> getMyProfile() async {
    final response = await _apiClient.dio.get(AppEndpoints.parents);
    final data = response.data['data'] as Map<String, dynamic>?;
    return data ?? {};
  }

  Future<List<Map<String, dynamic>>> getChildren() async {
    final response = await _apiClient.dio.get(AppEndpoints.parentsChildren);
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getChildPerformance(String childUserId) async {
    final response = await _apiClient.dio.get(
      '/parents/children/$childUserId/performance',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getChildCourses(String childUserId) async {
    final response = await _apiClient.dio.get(
      '/parents/children/$childUserId/courses',
      queryParameters: {'page': 1, 'limit': 10},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getChildExams(String childUserId) async {
    final response = await _apiClient.dio.get(
      '/parents/children/$childUserId/exams',
      queryParameters: {'page': 1, 'limit': 10},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getChildProgress(String childUserId) async {
    final response = await _apiClient.dio.get(
      '/parents/children/$childUserId/progress',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getChildStudyTime(String childUserId, {String? startDate, String? endDate}) async {
    final response = await _apiClient.dio.get(
      '/parents/children/$childUserId/study-time',
      queryParameters: {
        if (startDate != null) 'startDate': startDate,
        if (endDate != null) 'endDate': endDate,
      },
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['records'] as List? ?? data['studyTime'] as List? ?? [];
    return list.map((e) => e as Map<String, dynamic>).toList();
  }

  Future<List<Map<String, dynamic>>> getNotifications({int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      '/parents/notifications',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['notifications'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }
}
