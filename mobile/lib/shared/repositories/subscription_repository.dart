import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/network/api_client.dart';
import '../../core/constants/app_endpoints.dart';

class SubscriptionRepository {
  final ApiClient _apiClient;

  SubscriptionRepository(this._apiClient);

  Future<List<Map<String, dynamic>>> getPlans() async {
    final response = await _apiClient.get<Map<String, dynamic>>(AppEndpoints.subscriptionsPlans);
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }

  Future<Map<String, dynamic>> getMySubscription() async {
    final response = await _apiClient.get<Map<String, dynamic>>(AppEndpoints.subscriptionsStatus);
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<Map<String, dynamic>> activatePlan({required String planId}) async {
    final response = await _apiClient.post<Map<String, dynamic>>(
      AppEndpoints.subscriptionsActivate,
      data: {'planId': planId},
    );
    return response.data['data'] as Map<String, dynamic>? ?? {};
  }

  Future<void> cancelSubscription() async {
    await _apiClient.post(AppEndpoints.subscriptionsCancel);
  }

  Future<List<Map<String, dynamic>>> getPaymentHistory({int limit = 10}) async {
    final response = await _apiClient.get<Map<String, dynamic>>(
      AppEndpoints.paymentsHistory,
      queryParameters: {'limit': limit},
    );
    final data = response.data['data'] as List?;
    return data?.map((e) => e as Map<String, dynamic>).toList() ?? [];
  }
}

final subscriptionRepositoryProvider = Provider((ref) {
  final apiClient = ref.read(apiClientProvider);
  return SubscriptionRepository(apiClient);
});
