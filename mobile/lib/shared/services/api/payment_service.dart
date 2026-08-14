import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'payment_service.g.dart';

@JsonSerializable()
class Payment {
  final String id;
  final String userId;
  final double amount;
  final String currency;
  final String status;
  final String method;
  final String reference;
  final String? description;
  final Map<String, dynamic>? metadata;
  final String createdAt;
  final String updatedAt;

  const Payment({
    required this.id,
    required this.userId,
    required this.amount,
    required this.currency,
    required this.status,
    required this.method,
    required this.reference,
    this.description,
    this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Payment.fromJson(Map<String, dynamic> json) => _$PaymentFromJson(json);
  Map<String, dynamic> toJson() => _$PaymentToJson(this);
}

@JsonSerializable()
class PaymentGateway {
  final String id;
  final String name;
  final String code;
  final bool isActive;
  final Map<String, dynamic> config;

  const PaymentGateway({
    required this.id,
    required this.name,
    required this.code,
    required this.isActive,
    required this.config,
  });

  factory PaymentGateway.fromJson(Map<String, dynamic> json) => _$PaymentGatewayFromJson(json);
  Map<String, dynamic> toJson() => _$PaymentGatewayToJson(this);
}

@JsonSerializable()
class Wallet {
  final String id;
  final String userId;
  final double balance;
  final String currency;
  final String createdAt;
  final String updatedAt;

  const Wallet({
    required this.id,
    required this.userId,
    required this.balance,
    required this.currency,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) => _$WalletFromJson(json);
  Map<String, dynamic> toJson() => _$WalletToJson(this);
}

@JsonSerializable()
class WalletTransaction {
  final String id;
  final String walletId;
  final String type;
  final double amount;
  final String description;
  final String? reference;
  final double balanceAfter;
  final String createdAt;

  const WalletTransaction({
    required this.id,
    required this.walletId,
    required this.type,
    required this.amount,
    required this.description,
    this.reference,
    required this.balanceAfter,
    required this.createdAt,
  });

  factory WalletTransaction.fromJson(Map<String, dynamic> json) => _$WalletTransactionFromJson(json);
  Map<String, dynamic> toJson() => _$WalletTransactionToJson(this);
}

class PaymentService {
  final ApiClient _client;

  PaymentService({ApiClient? client}) : _client = client ?? ApiClient();

  // List payments
  Future<ApiResponse<List<Payment>>> listPayments({
    int page = 1,
    int limit = 20,
    String? status,
    String? userId,
    String? startDate,
    String? endDate,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (status != null) queryParams['status'] = status;
    if (userId != null) queryParams['userId'] = userId;
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;

    return _client.get<List<Payment>>(
      '/payments',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Payment.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get payment by ID
  Future<ApiResponse<Payment>> getPayment(String paymentId) async {
    return _client.get<Payment>(
      '/payments/$paymentId',
      fromJson: Payment.fromJson,
    );
  }

  // Create payment
  Future<ApiResponse<Payment>> createPayment({
    required double amount,
    String currency = 'NGN',
    required String method,
    String? reference,
    String? description,
    Map<String, dynamic>? metadata,
  }) async {
    return _client.post<Payment>(
      '/payments',
      body: {
        'amount': amount,
        'currency': currency,
        'method': method,
        'reference': reference,
        'description': description,
        'metadata': metadata,
      },
      fromJson: Payment.fromJson,
    );
  }

  // Verify payment
  Future<ApiResponse<Map<String, dynamic>>> verifyPayment(String reference) async {
    return _client.post<Map<String, dynamic>>(
      '/payments/verify',
      body: {'reference': reference},
    );
  }

  // List payment gateways
  Future<ApiResponse<List<PaymentGateway>>> listPaymentGateways() async {
    return _client.get<List<PaymentGateway>>(
      '/payments/gateways',
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => PaymentGateway.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get my wallet
  Future<ApiResponse<Wallet>> getMyWallet() async {
    return _client.get<Wallet>(
      '/payments/wallet',
      fromJson: Wallet.fromJson,
    );
  }

  // List wallet transactions
  Future<ApiResponse<List<WalletTransaction>>> listWalletTransactions({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get<List<WalletTransaction>>(
      '/payments/wallet/transactions',
      queryParams: {'page': page, 'limit': limit},
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => WalletTransaction.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Fund wallet
  Future<ApiResponse<Map<String, dynamic>>> fundWallet({
    required double amount,
    required String paymentMethodId,
  }) async {
    return _client.post<Map<String, dynamic>>(
      '/payments/wallet/fund',
      body: {
        'amount': amount,
        'paymentMethodId': paymentMethodId,
      },
    );
  }
}
