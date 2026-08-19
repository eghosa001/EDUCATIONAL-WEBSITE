import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../../../core/constants/app_endpoints.dart';
import '../../models/live_class/live_class_model.dart';

class LiveClassRepository {
  final ApiClient _apiClient;

  LiveClassRepository(this._apiClient);

  Future<PaginatedResponse<LiveClass>> getClasses({
    int page = 1,
    int limit = 20,
    String? status,
    String? subjectId,
    String? teacherId,
    String? search,
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.liveClasses,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (status != null) 'status': status,
        if (subjectId != null) 'subject_id': subjectId,
        if (teacherId != null) 'teacher_id': teacherId,
        if (search != null) 'search': search,
      },
    );

    final data = (response.data['classes'] as List?)
        ?.map((e) => LiveClass.fromJson(e as Map<String, dynamic>))
        .toList();

    final pagination = response.data['pagination'] as Map<String, dynamic>?;

    return PaginatedResponse<LiveClass>(
      data: data ?? [],
      page: pagination?['page'] as int? ?? page,
      limit: pagination?['limit'] as int? ?? limit,
      total: pagination?['total'] as int? ?? 0,
      totalPages: pagination?['totalPages'] as int? ?? 0,
    );
  }

  Future<LiveClass> getClass(String classId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.liveClassesDetail.replaceFirst('{id}', classId),
    );
    return LiveClass.fromJson(response.data['class'] as Map<String, dynamic>);
  }

  Future<LiveClass> getMyClass(String classId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.liveClassesMy.replaceFirst('{id}', classId),
    );
    return LiveClass.fromJson(response.data['class'] as Map<String, dynamic>);
  }

  Future<PaginatedResponse<LiveClass>> getMyClasses({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.liveClassesMy,
      queryParameters: {'page': page, 'limit': limit},
    );

    final data = (response.data['classes'] as List?)
        ?.map((e) => LiveClass.fromJson(e as Map<String, dynamic>))
        .toList();

    final pagination = response.data['pagination'] as Map<String, dynamic>?;

    return PaginatedResponse<LiveClass>(
      data: data ?? [],
      page: pagination?['page'] as int? ?? page,
      limit: pagination?['limit'] as int? ?? limit,
      total: pagination?['total'] as int? ?? 0,
      totalPages: pagination?['totalPages'] as int? ?? 0,
    );
  }

  Future<PaginatedResponse<LiveClass>> getUpcomingClasses({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.liveClassesUpcoming,
      queryParameters: {'page': page, 'limit': limit},
    );

    final data = (response.data['classes'] as List?)
        ?.map((e) => LiveClass.fromJson(e as Map<String, dynamic>))
        .toList();

    final pagination = response.data['pagination'] as Map<String, dynamic>?;

    return PaginatedResponse<LiveClass>(
      data: data ?? [],
      page: pagination?['page'] as int? ?? page,
      limit: pagination?['limit'] as int? ?? limit,
      total: pagination?['total'] as int? ?? 0,
      totalPages: pagination?['totalPages'] as int? ?? 0,
    );
  }

  Future<LiveClass> createClass({
    required String title,
    required String meetingUrl,
    required DateTime scheduledAt,
    required int durationMinutes,
    String? description,
    String? subjectId,
    String? topicId,
    int? maxParticipants,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppEndpoints.liveClasses,
      data: {
        'title': title,
        'meeting_url': meetingUrl,
        'scheduled_at': scheduledAt.toIso8601String(),
        'duration_minutes': durationMinutes,
        if (description != null) 'description': description,
        if (subjectId != null) 'subject_id': subjectId,
        if (topicId != null) 'topic_id': topicId,
        if (maxParticipants != null) 'max_participants': maxParticipants,
      },
    );
    return LiveClass.fromJson(response.data['class'] as Map<String, dynamic>);
  }

  Future<LiveClass> updateClass(String classId, {
    String? title,
    String? description,
    String? meetingUrl,
    int? durationMinutes,
    String? status,
  }) async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      AppEndpoints.liveClassesDetail.replaceFirst('{id}', classId),
      data: {
        if (title != null) 'title': title,
        if (description != null) 'description': description,
        if (meetingUrl != null) 'meeting_url': meetingUrl,
        if (durationMinutes != null) 'duration_minutes': durationMinutes,
        if (status != null) 'status': status,
      },
    );
    return LiveClass.fromJson(response.data['class'] as Map<String, dynamic>);
  }

  Future<void> deleteClass(String classId) async {
    await _apiClient.delete(
      AppEndpoints.liveClassesDetail.replaceFirst('{id}', classId),
    );
  }

  Future<void> joinClass(String classId) async {
    await _apiClient.post(
      AppEndpoints.liveClassesJoin.replaceFirst('{id}', classId),
    );
  }

  Future<void> leaveClass(String classId) async {
    await _apiClient.delete(
      AppEndpoints.liveClassesLeave.replaceFirst('{id}', classId),
    );
  }

  Future<LiveClass> endClass(String classId) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppEndpoints.liveClassesEnd.replaceFirst('{id}', classId),
    );
    return LiveClass.fromJson(response.data['class'] as Map<String, dynamic>);
  }

  Future<List<Map<String, dynamic>>> getClassParticipants(String classId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.liveClassesParticipants.replaceFirst('{id}', classId),
    );
    return List<Map<String, dynamic>>.from(response.data['participants'] as List? ?? []);
  }

  Future<Map<String, dynamic>> getClassAnalytics(String classId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.liveClassesAnalytics.replaceFirst('{id}', classId),
    );
    return response.data['analytics'] as Map<String, dynamic>? ?? {};
  }

  Future<LiveClassAnalytics> getAnalytics(String classId) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.liveClassesAnalytics.replaceFirst('{id}', classId),
    );
    return LiveClassAnalytics.fromJson(
      response.data['analytics'] as Map<String, dynamic>,
    );
  }

  Future<LiveClass> markAttendance(String classId, String status) async {
    final response = await _apiClient.patch<Map<String, dynamic>>(
      AppEndpoints.liveClassesAttendance.replaceFirst('{id}', classId),
      data: {'status': status},
    );
    return LiveClass.fromJson(response.data['attendance'] as Map<String, dynamic>);
  }
}

