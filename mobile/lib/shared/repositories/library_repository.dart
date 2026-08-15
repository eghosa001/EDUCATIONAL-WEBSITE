import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';
import '../models/library/resource_model.dart';

class LibraryRepository {
  final ApiClient _apiClient;

  LibraryRepository(this._apiClient);

  Future<List<LibraryItem>> getResources({
    int page = 1,
    int limit = 20,
    String? search,
    String? resourceType,
    String? subjectId,
    String? classId,
    String? examBoard,
    bool? isFree,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.library,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (search != null) 'search': search,
        if (resourceType != null) 'resourceType': resourceType,
        if (subjectId != null) 'subjectId': subjectId,
        if (classId != null) 'classId': classId,
        if (examBoard != null) 'examBoard': examBoard,
        if (isFree != null) 'isFree': isFree,
      },
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => LibraryItem.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  Future<Map<String, dynamic>> getLibraryStats() async {
    final response = await _apiClient.dio.get(AppEndpoints.libraryStats);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getPastQuestionExams() async {
    final response = await _apiClient.dio.get(AppEndpoints.libraryPastQuestionsExams);
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<LibraryItem>> getPastQuestions({
    String? board,
    int? year,
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.libraryPastQuestions,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (board != null) 'board': board,
        if (year != null) 'year': year,
      },
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => LibraryItem.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }

  Future<LibraryItem> getResource(String resourceId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.libraryDetail.replaceFirst('{id}', resourceId),
    );
    return LibraryItem.fromJson(response.data['data'] as Map<String, dynamic>);
  }

  Future<String> downloadResource(String resourceId) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.libraryDownload.replaceFirst('{id}', resourceId),
    );
    return response.data['data']['url'] as String? ?? '';
  }

  Future<List<LibraryItem>> searchResources(String query, {int limit = 20}) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.librarySearch,
      queryParameters: {'q': query, 'limit': limit},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => LibraryItem.fromJson(e as Map<String, dynamic>)).toList() ?? [];
  }
}

final libraryRepositoryProvider = Provider<LibraryRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return LibraryRepository(apiClient);
});
