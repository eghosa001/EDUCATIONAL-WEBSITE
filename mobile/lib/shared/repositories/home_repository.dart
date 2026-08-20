import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class HomeRepository {
  final ApiClient _apiClient;

  HomeRepository(this._apiClient);

  Future<Map<String, dynamic>> getOverview() async {
    final response = await _apiClient.get<Map<String, dynamic>>(AppEndpoints.progress);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getRecentCourses({int limit = 5}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      '${AppEndpoints.courses}/recent',
      queryParameters: {'limit': limit},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getRecommendedCourses({int limit = 6}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.courses,
      queryParameters: {'featured': true, 'limit': limit},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getUpcomingExams({int limit = 5}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.exams,
      queryParameters: {'limit': limit, 'status': 'upcoming'},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getStudyStreak() async {
    final response = await _apiClient.get<Map<String, dynamic>>(AppEndpoints.gamificationStreak);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getAnnouncements({int limit = 5}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.notifications,
      queryParameters: {'limit': limit, 'type': 'announcement'},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }
}

final homeRepositoryProvider = Provider((ref) {
  final apiClient = ref.read(apiClientProvider);
  return HomeRepository(apiClient);
});
