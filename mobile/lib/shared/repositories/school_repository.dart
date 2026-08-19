import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class SchoolRepository {
  final ApiClient _apiClient;

  SchoolRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getSchools() async {
    final response = await _apiClient.dio.get(AppEndpoints.schools);
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getSchool(String schoolId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId),
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> getSchoolStats(String schoolId) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/stats',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getStudents(String schoolId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/students',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['students'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getTeachers(String schoolId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/teachers',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['teachers'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getClasses(String schoolId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/classes',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['classes'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getTimetables(String schoolId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/timetables',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['timetables'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getAttendance(String schoolId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/attendance',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['attendance'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getAttendanceStats(String schoolId) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/attendance/stats',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getFees(String schoolId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/fees',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['fees'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getFeeSummary(String schoolId) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/fees/summary',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getResults(String schoolId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/results',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['results'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getResultSummary(String schoolId) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.schoolsDetail.replaceFirst('{id}', schoolId)}/results/summary',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> joinSchool(String schoolCode) async {
    await _apiClient.dio.post(
      '${AppEndpoints.schools}/join',
      data: {'schoolCode': schoolCode},
    );
  }
}
