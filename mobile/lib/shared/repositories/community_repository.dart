import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class CommunityRepository {
  final ApiClient _apiClient;

  CommunityRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getPosts({
    int page = 1,
    int limit = 20,
    String? type,
    String? forumId,
    String? subjectId,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.communityPosts,
      queryParameters: {
        'page': page,
        'limit': limit,
        if (type != null) 'type': type,
        if (forumId != null) 'forumId': forumId,
        if (subjectId != null) 'subjectId': subjectId,
      },
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['posts'] as List? ?? data as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getPost(String postId) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.communityPosts}/$postId',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getForums({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.communityForum,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['forums'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getForum(String forumId) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.communityForum}/$forumId',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<List<Map<String, dynamic>>> getStudyGroups({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _apiClient.dio.get(
      AppEndpoints.communityStudyGroups,
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response.data['data'] as Map<String, dynamic>? ?? {};
    final list = data['studyGroups'] as List?;
    return list?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getStudyGroup(String groupId) async {
    final response = await _apiClient.dio.get(
      '${AppEndpoints.communityStudyGroups}/$groupId',
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> createPost(Map<String, dynamic> post) async {
    await _apiClient.dio.post(AppEndpoints.communityPosts, data: post);
  }

  Future<void> likePost(String postId) async {
    await _apiClient.dio.post('${AppEndpoints.communityPosts}/$postId/like');
  }

  Future<void> unlikePost(String postId) async {
    await _apiClient.dio.delete('${AppEndpoints.communityPosts}/$postId/like');
  }

  Future<void> joinForum(String forumId) async {
    await _apiClient.dio.post('${AppEndpoints.communityForum}/$forumId/join');
  }

  Future<void> leaveForum(String forumId) async {
    await _apiClient.dio.post('${AppEndpoints.communityForum}/$forumId/leave');
  }

  Future<void> joinStudyGroup(String groupId) async {
    await _apiClient.dio.post('${AppEndpoints.communityStudyGroups}/$groupId/join');
  }

  Future<void> leaveStudyGroup(String groupId) async {
    await _apiClient.dio.post('${AppEndpoints.communityStudyGroups}/$groupId/leave');
  }
}
