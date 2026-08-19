import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';
import '../models/course/course_model.dart';

class CourseRepository {
  final ApiClient _apiClient;

  CourseRepository(this._apiClient);

  Future<List<Course>> getCourses({
    int page = 1,
    int limit = 20,
    String? category,
    String? level,
    String? search,
    String? sortBy,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.courses,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (category != null) 'category': category,
        if (level != null) 'level': level,
        if (search != null) 'search': search,
        if (sortBy != null) 'sortBy': sortBy,
      },
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => Course.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  Future<Course> getCourse(String courseId) async {
    final response = await _apiClient.dio.get(AppEndpoints.coursesDetail.replaceFirst('{id}', courseId));
    return Course.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<Course> enrollCourse(String courseId) async {
    final response = await _apiClient.dio.post(
      AppEndpoints.coursesEnroll.replaceFirst('{id}', courseId),
    );
    return Course.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<List<Course>> getSavedCourses() async {
    final response = await _apiClient.dio.get(AppEndpoints.coursesSaved);
    final data = response.data['data'] as List?;
    return data?.map((e) => Course.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  Future<List<Course>> getRecentCourses() async {
    final response = await _apiClient.dio.get(AppEndpoints.coursesRecent);
    final data = response.data['data'] as List?;
    return data?.map((e) => Course.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  Future<void> saveCourse(String courseId) async {
    await _apiClient.dio.post('${AppEndpoints.coursesDetail.replaceFirst('{id}', courseId)}/save');
  }

  Future<void> unsaveCourse(String courseId) async {
    await _apiClient.dio.delete('${AppEndpoints.coursesDetail.replaceFirst('{id}', courseId)}/save');
  }
}

