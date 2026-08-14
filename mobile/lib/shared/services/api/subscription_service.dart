import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'subscription_service.g.dart';

@JsonSerializable()
class SubscriptionPlan {
  final String id;
  final String name;
  final double priceMonthly;
  final double priceYearly;
  final List<String> features;

  const SubscriptionPlan({
    required this.id,
    required this.name,
    required this.priceMonthly,
    required this.priceYearly,
    required this.features,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) => _$SubscriptionPlanFromJson(json);
  Map<String, dynamic> toJson() => _$SubscriptionPlanToJson(this);
}

@JsonSerializable()
class Subscription {
  final String id;
  final String userId;
  final String planId;
  final String status;
  final String currentPeriodEnd;
  final String createdAt;

  const Subscription({
    required this.id,
    required this.userId,
    required this.planId,
    required this.status,
    required this.currentPeriodEnd,
    required this.createdAt,
  });

  factory Subscription.fromJson(Map<String, dynamic> json) => _$SubscriptionFromJson(json);
  Map<String, dynamic> toJson() => _$SubscriptionToJson(this);
}

@JsonSerializable()
class Invoice {
  final String id;
  final String subscriptionId;
  final double amount;
  final String status;
  final String issuedAt;

  const Invoice({
    required this.id,
    required this.subscriptionId,
    required this.amount,
    required this.status,
    required this.issuedAt,
  });

  factory Invoice.fromJson(Map<String, dynamic> json) => _$InvoiceFromJson(json);
  Map<String, dynamic> toJson() => _$InvoiceToJson(this);
}

@JsonSerializable()
class PaymentMethod {
  final String id;
  final String type;
  final Map<String, dynamic> details;
  final bool isDefault;

  const PaymentMethod({
    required this.id,
    required this.type,
    required this.details,
    required this.isDefault,
  });

  factory PaymentMethod.fromJson(Map<String, dynamic> json) => _$PaymentMethodFromJson(json);
  Map<String, dynamic> toJson() => _$PaymentMethodToJson(this);
}

class SubscriptionService {
  final ApiClient _client;

  SubscriptionService({ApiClient? client}) : _client = client ?? ApiClient();

  // List subscription plans
  Future<ApiResponse<List<SubscriptionPlan>>> listSubscriptionPlans() async {
    return _client.get<List<SubscriptionPlan>>(
      '/subscriptions/plans',
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => SubscriptionPlan.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get subscription plan by ID
  Future<ApiResponse<SubscriptionPlan>> getSubscriptionPlan(String planId) async {
    return _client.get<SubscriptionPlan>(
      '/subscriptions/plans/$planId',
      fromJson: SubscriptionPlan.fromJson,
    );
  }

  // Get my subscription
  Future<ApiResponse<Subscription>> getMySubscription() async {
    return _client.get<Subscription>(
      '/subscriptions/my',
      fromJson: Subscription.fromJson,
    );
  }

  // Create subscription
  Future<ApiResponse<Map<String, dynamic>>> createSubscription({
    required String planId,
    String? paymentMethodId,
    String? couponCode,
  }) async {
    return _client.post<Map<String, dynamic>>(
      '/subscriptions',
      body: {
        'planId': planId,
        'paymentMethodId': paymentMethodId,
        'couponCode': couponCode,
      },
    );
  }

  // Update subscription
  Future<ApiResponse<Subscription>> updateSubscription(
    String subscriptionId, {
    String? planId,
    String? paymentMethodId,
  }) async {
    final body = <String, dynamic>{};
    if (planId != null) body['planId'] = planId;
    if (paymentMethodId != null) body['paymentMethodId'] = paymentMethodId;

    return _client.patch<Subscription>(
      '/subscriptions/$subscriptionId',
      body: body,
      fromJson: Subscription.fromJson,
    );
  }

  // Cancel subscription
  Future<ApiResponse<Subscription>> cancelSubscription(String subscriptionId) async {
    return _client.post<Subscription>(
      '/subscriptions/$subscriptionId/cancel',
      fromJson: Subscription.fromJson,
    );
  }

  // Resume subscription
  Future<ApiResponse<Subscription>> resumeSubscription(String subscriptionId) async {
    return _client.post<Subscription>(
      '/subscriptions/$subscriptionId/resume',
      fromJson: Subscription.fromJson,
    );
  }

  // List my invoices
  Future<ApiResponse<List<Invoice>>> listMyInvoices({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get<List<Invoice>>(
      '/subscriptions/invoices',
      queryParams: {'page': page, 'limit': limit},
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Invoice.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get invoice by ID
  Future<ApiResponse<Invoice>> getInvoice(String invoiceId) async {
    return _client.get<Invoice>(
      '/subscriptions/invoices/$invoiceId',
      fromJson: Invoice.fromJson,
    );
  }

  // Download invoice
  Future<ApiResponse<Map<String, dynamic>>> downloadInvoice(String invoiceId) async {
    return _client.get<Map<String, dynamic>>('/subscriptions/invoices/$invoiceId/download');
  }

  // List my payment methods
  Future<ApiResponse<List<PaymentMethod>>> listMyPaymentMethods() async {
    return _client.get<List<PaymentMethod>>(
      '/subscriptions/payment-methods',
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => PaymentMethod.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Add payment method
  Future<ApiResponse<PaymentMethod>> addPaymentMethod({
    required String type,
    required Map<String, dynamic> details,
  }) async {
    return _client.post<PaymentMethod>(
      '/subscriptions/payment-methods',
      body: {'type': type, 'details': details},
      fromJson: PaymentMethod.fromJson,
    );
  }

  // Delete payment method
  Future<ApiResponse<void>> deletePaymentMethod(String paymentMethodId) async {
    return _client.delete<void>('/subscriptions/payment-methods/$paymentMethodId');
  }

  // Set default payment method
  Future<ApiResponse<PaymentMethod>> setDefaultPaymentMethod(String paymentMethodId) async {
    return _client.post<PaymentMethod>(
      '/subscriptions/payment-methods/$paymentMethodId/default',
      fromJson: PaymentMethod.fromJson,
    );
  }
}
