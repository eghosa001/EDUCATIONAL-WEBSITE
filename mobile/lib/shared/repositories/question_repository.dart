import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class QuestionRepository {
  final ApiClient _apiClient;

  QuestionRepository(this._apiClient);

  Future<List<dynamic>> getBoards() async {
    final response = await _apiClient.dio.get(AppEndpoints.pastQuestionsBoards);
    return List<dynamic>.from(response.data['data']['boards'] as List? ?? []);
  }

  Future<Map<String, dynamic>> getQuestions({
    String? board,
    String? subjectId,
    int? year,
    String? topicId,
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestions,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (board != null) 'board': board,
        if (subjectId != null) 'subjectId': subjectId,
        if (year != null) 'year': year,
        if (topicId != null) 'topicId': topicId,
      },
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getQuestion(String questionId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestionsDetail.replaceFirst('{id}', questionId),
    );
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<List<dynamic>> getTopicsByBoard(String board) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestionsTopics.replaceFirst('{board}', board),
    );
    return List<dynamic>.from(response.data['data']['topics'] as List? ?? []);
  }

  Future<List<dynamic>> getPracticeQuestions({
    required String board,
    String? subjectId,
    String? topicId,
    int count = 20,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestionsPractice.replaceFirst('{board}', board),
      queryParameters: {
        'subjectId': subjectId,
        'topicId': topicId,
        'count': count,
      },
    );
    return List<dynamic>.from(response.data['data']['questions'] as List? ?? []);
  }

  Future<Map<String, dynamic>> generateTimedTest({
    required String board,
    String? subjectId,
    int count = 40,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.pastQuestionsTimedTest.replaceFirst('{board}', board),
      queryParameters: {'subjectId': subjectId, 'count': count},
    );
    return response.data['data'] as Map<String, dynamic>;
  }
}

final questionRepositoryProvider = Provider<QuestionRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return QuestionRepository(apiClient);
});
