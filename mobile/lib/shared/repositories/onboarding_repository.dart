import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class OnboardingRepository {
  final ApiClient _apiClient;

  OnboardingRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getEducationLevels() async {
    final response = await _apiClient.get<Map<String, dynamic>>(AppEndpoints.educationLevels);
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getPrograms({required String levelId}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.educationPrograms,
      queryParameters: {'levelId': levelId},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getClasses({required String programId}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.educationClasses,
      queryParameters: {'programId': programId},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getTerms({required String classId}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.educationTerms,
      queryParameters: {'classId': classId},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<void> saveOnboardingData({
    required String levelId,
    required String classId,
    required String termId,
  }) async {
    await _apiClient.patch(
      AppEndpoints.usersUpdate,
      data: {'levelId': levelId, 'classId': classId, 'termId': termId},
    );
  }
}

final onboardingRepositoryProvider = Provider((ref) {
  final apiClient = ref.read(apiClientProvider);
  return OnboardingRepository(apiClient);
});
