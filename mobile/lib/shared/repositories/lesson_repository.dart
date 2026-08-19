import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';
import '../models/course/course_model.dart';

class LessonRepository {
  final ApiClient _apiClient;

  LessonRepository(this._apiClient);

  Future<List<Lesson>> getLessons(String courseId, {int page = 1, int limit = 20}) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.lessons,
      queryParameters: {'courseId': courseId, 'page': page, 'limit': limit},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => Lesson.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  Future<Lesson> getLesson(String lessonId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.lessonsDetail.replaceFirst('{id}', lessonId),
    );
    return Lesson.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<void> completeLesson(String lessonId) async {
    await _apiClient.dio.post(
      AppEndpoints.lessonsComplete.replaceFirst('{id}', lessonId),
    );
  }

  Future<Map<String, dynamic>> getLessonProgress(String lessonId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.lessonsProgress.replaceFirst('{id}', lessonId),
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }
}

