import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class TeacherRepository {
  final ApiClient _apiClient;

  TeacherRepository(this._apiClient);

  Future<Map<String, dynamic>> getMyProfile() async {
    final response = await _apiClient.dio.get(AppEndpoints.teachers);
    final data = response.data['data'] as Map<String, dynamic>?;
    return data ?? {};
  }

  Future<List<Map<String, dynamic>>> getMyCourses({int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.teachersCourses,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['courses'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getCourseStats(String courseId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.teachersCourses.replaceFirst('{id}', courseId).replaceFirst('/courses', '').substring(0, AppEndpoints.teachersCourses.length - '/courses'.length) + '/$courseId/stats',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getMyStudents({int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.teachers.replaceAll('/teachers', '/teachers/students'),
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['students'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getMyExams({int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.teachers.replaceAll('/teachers', '/teachers/exams'),
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['exams'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getMyAssignments({int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.teachers.replaceAll('/teachers', '/teachers/assignments'),
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['assignments'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getEarningsSummary() async {
    final response = await _apiClient.dio.get(
      AppEndpoints.teachers.replaceAll('/teachers', '/teachers/earnings/summary'),
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getAnalytics() async {
    final response = await _apiClient.dio.get(
      AppEndpoints.teachers.replaceAll('/teachers', '/teachers/analytics'),
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getLiveClasses({int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.teachers.replaceAll('/teachers', '/teachers/live-classes'),
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['liveClasses'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getPendingSubmissions({int page = 1, int limit = 20}) async {
    final assignments = await getMyAssignments(page: page, limit: limit);
    final pending = <Map<String, dynamic>>[];
    for (final assignment in assignments) {
      final assignmentId = assignment['id'] as String?;
      if (assignmentId != null) {
        try {
          final response = await _apiClient.dio.get(
            '/teachers/assignments/$assignmentId/submissions',
            queryParameters: {'page': 1, 'limit': limit, 'status': 'pending'},
          );
          final data = response.data['data'] as Map<String, dynamic>? ?? {};
          final list = data['submissions'] as List? ?? data['pendingSubmissions'] as List?;
          if (list != null) {
            for (final sub in list) {
              pending.add({...sub as Map<String, dynamic>, 'assignmentTitle': assignment['title'], 'assignmentId': assignmentId});
            }
          }
        } catch (_) {}
      }
    }
    return pending;
  }
}
