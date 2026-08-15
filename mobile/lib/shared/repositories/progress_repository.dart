import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class ProgressRepository {
  final ApiClient _apiClient;

  ProgressRepository(this._apiClient);

  Future<Map<String, dynamic>> getOverallProgress() async {
    final response = await _apiClient.dio.get(AppEndpoints.progress);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getCourseProgress({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.progressCourses,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getLessonProgress({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.progressLessons,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getAnalytics() async {
    final response = await _apiClient.dio.get(AppEndpoints.progressAnalytics);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }
}

final progressRepositoryProvider = Provider<ProgressRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ProgressRepository(apiClient);
});
