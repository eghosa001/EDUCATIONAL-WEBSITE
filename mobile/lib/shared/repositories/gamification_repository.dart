import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';
import '../providers/index.dart';

class GamificationRepository {
  final ApiClient _apiClient;

  GamificationRepository(this._apiClient);

  Future<Map<String, dynamic>> getMyPoints() async {
    final response = await _apiClient.dio.get(AppEndpoints.gamificationPoints);
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    return data['points'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getLeaderboard({
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.gamificationLeaderboard,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['leaderboard'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getMyBadges({
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.gamificationMyBadges,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['badges'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getAchievements() async {
    final response = await _apiClient.dio.get(AppEndpoints.gamificationAchievements);
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['achievements'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getMyAchievements({
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.gamificationMyAchievements,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['achievements'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getMyStreak() async {
    final response = await _apiClient.dio.get(AppEndpoints.gamificationStreak);
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    return data['streak'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getRewards() async {
    final response = await _apiClient.dio.get(AppEndpoints.gamificationRewards);
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['rewards'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<List<Map<String, dynamic>>> getMyRewards({
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.gamificationMyRewards,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['rewards'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<void> redeemReward(String rewardId) async {
    final path = AppEndpoints.gamificationRedeemReward.replaceAll('{id}', rewardId);
    await _apiClient.dio.post(path);
  }

  Future<List<Map<String, dynamic>>> getPointsHistory({
    int page = 1,
    int limit = 50,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.gamificationPointsHistory,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['history'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }
}

