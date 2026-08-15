import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'ai_tutor_service.dart';
import '../../core/storage/storage_service.dart';

class AiTutorRepository {
  final AiTutorService _service;
  final StorageService _storage;

  AiTutorRepository({
    required AiTutorService service,
    required StorageService storage,
  }) : _service = service,
       _storage = storage;

  Future<AiTutorResponse> sendMessage({
    required String message,
    String? subjectId,
    String? topicId,
  }) async {
    final token = _storage.token;
    if (token != null && token.isNotEmpty) {
      _service.token = token;
    }

    final response = await _service.chat(
      message: message,
      subjectId: subjectId,
      topicId: topicId,
    );

    if (response.sessionId.isNotEmpty) {
      _service.setSessionId(response.sessionId);
    }

    return response;
  }

  Future<Map<String, dynamic>> getUsageStats() async {
    return _service.getUsageStats();
  }

  void clearSession() {
    _service.clearSession();
  }
}

final aiTutorServiceProvider = Provider<AiTutorService>((ref) {
  return AiTutorService();
});

final aiTutorRepositoryProvider = Provider<AiTutorRepository>((ref) {
  final service = ref.watch(aiTutorServiceProvider);
  final storage = ref.watch(storageServiceProvider);
  return AiTutorRepository(service: service, storage: storage);
});
