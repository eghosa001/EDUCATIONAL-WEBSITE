import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class ExamRepository {
  final ApiClient _apiClient;

  ExamRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getExams({
    int page = 1,
    int limit = 20,
    String? courseId,
    String? search,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.exams,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (courseId != null) 'courseId': courseId,
        if (search != null) 'search': search,
      },
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getExam(String examId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.examsDetail.replaceFirst('{id}', examId),
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> startExam(String examId) async {
    final response = await _apiClient.dio.post(
      AppEndpoints.examsStart.replaceFirst('{id}', examId),
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> submitExam(String examId, Map<String, dynamic> answers) async {
    final response = await _apiClient.dio.post(
      AppEndpoints.examsSubmit.replaceFirst('{id}', examId),
      data: {'answers': answers},
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getExamResults(String examId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.examsResults.replaceFirst('{id}', examId),
    );
    return response.data['data'] as Map<String, dynamic>;
  }
}

final examRepositoryProvider = Provider<ExamRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return ExamRepository(apiClient);
});
