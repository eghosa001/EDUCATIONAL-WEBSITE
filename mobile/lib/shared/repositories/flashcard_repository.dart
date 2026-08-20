import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class FlashcardRepository {
  final ApiClient _apiClient;

  FlashcardRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getMyFlashcards({
    int page = 1,
    int limit = 50,
    String? difficulty,
  }) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.flashcards,
      queryParameters: {
        'my': 'true',
        'page': page,
        'limit': limit,
        if (difficulty != null) 'difficulty': difficulty,
      },
    );
    final data = response.data['data']['flashcards'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> generateFlashcards({
    required String subjectId,
    String? topicId,
    int count = 20,
  }) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppEndpoints.flashcardsGenerate,
      data: {'subjectId': subjectId, 'topicId': topicId, 'count': count},
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> rateCard({
    required String cardId,
    required String rating,
  }) async {
    await _apiClient.post(
      '${AppEndpoints.flashcards}/$cardId/rate',
      data: {'rating': rating},
    );
  }

  Future<List<Map<String, dynamic>>> getCardsDueToday() async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.flashcardsReview,
      queryParameters: {'dueToday': 'true'},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }
}

final flashcardRepositoryProvider = Provider((ref) {
  final apiClient = ref.read(apiClientProvider);
  return FlashcardRepository(apiClient);
});
