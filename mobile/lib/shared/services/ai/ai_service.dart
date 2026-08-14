import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'ai_service.g.dart';

@JsonSerializable()
class ChatMessage {
  final String id;
  final String role;
  final String content;
  final String createdAt;

  const ChatMessage({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) => _$ChatMessageFromJson(json);
  Map<String, dynamic> toJson() => _$ChatMessageToJson(this);
}

@JsonSerializable()
class AiTutorSession {
  final String id;
  final String userId;
  final String? subjectId;
  final List<ChatMessage> messages;
  final String createdAt;
  final String updatedAt;

  const AiTutorSession({
    required this.id,
    required this.userId,
    this.subjectId,
    required this.messages,
    required this.createdAt,
    required this.updatedAt,
  });

  factory AiTutorSession.fromJson(Map<String, dynamic> json) => _$AiTutorSessionFromJson(json);
  Map<String, dynamic> toJson() => _$AiTutorSessionToJson(this);
}

@JsonSerializable()
class AiExplanation {
  final String explanation;
  final List<String> keyPoints;
  final List<String>? examples;

  const AiExplanation({
    required this.explanation,
    required this.keyPoints,
    this.examples,
  });

  factory AiExplanation.fromJson(Map<String, dynamic> json) => _$AiExplanationFromJson(json);
  Map<String, dynamic> toJson() => _$AiExplanationToJson(this);
}

@JsonSerializable()
class AiFlashcard {
  final String id;
  final String front;
  final String back;
  final String subjectId;
  final String? topicId;

  const AiFlashcard({
    required this.id,
    required this.front,
    required this.back,
    required this.subjectId,
    this.topicId,
  });

  factory AiFlashcard.fromJson(Map<String, dynamic> json) => _$AiFlashcardFromJson(json);
  Map<String, dynamic> toJson() => _$AiFlashcardToJson(this);
}

@JsonSerializable()
class AiSummary {
  final String summary;
  final List<String> keyPoints;
  final int readingTimeMinutes;

  const AiSummary({
    required this.summary,
    required this.keyPoints,
    required this.readingTimeMinutes,
  });

  factory AiSummary.fromJson(Map<String, dynamic> json) => _$AiSummaryFromJson(json);
  Map<String, dynamic> toJson() => _$AiSummaryToJson(this);
}

@JsonSerializable()
class AiUsageStats {
  final int totalRequests;
  final int requestsToday;
  final int requestsThisMonth;
  final String mostUsedFeature;

  const AiUsageStats({
    required this.totalRequests,
    required this.requestsToday,
    required this.requestsThisMonth,
    required this.mostUsedFeature,
  });

  factory AiUsageStats.fromJson(Map<String, dynamic> json) => _$AiUsageStatsFromJson(json);
  Map<String, dynamic> toJson() => _$AiUsageStatsToJson(this);
}

class AiService {
  final ApiClient _client;

  AiService({ApiClient? client}) : _client = client ?? ApiClient();

  // Send AI tutor message
  Future<ApiResponse<Map<String, dynamic>>> sendAiTutorMessage({
    required String message,
    String? subjectId,
    String? topicId,
    Map<String, dynamic>? context,
  }) async {
    return _client.post<Map<String, dynamic>>(
      '/ai/tutor',
      body: {
        'message': message,
        'subjectId': subjectId,
        'topicId': topicId,
        'context': context,
      },
    );
  }

  // List AI tutor sessions
  Future<ApiResponse<List<AiTutorSession>>> listAiTutorSessions({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get<List<AiTutorSession>>(
      '/ai/tutor/sessions',
      queryParams: {'page': page, 'limit': limit},
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => AiTutorSession.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get AI tutor session
  Future<ApiResponse<AiTutorSession>> getAiTutorSession(String sessionId) async {
    return _client.get<AiTutorSession>(
      '/ai/tutor/sessions/$sessionId',
      fromJson: AiTutorSession.fromJson,
    );
  }

  // Delete AI tutor session
  Future<ApiResponse<void>> deleteAiTutorSession(String sessionId) async {
    return _client.delete<void>('/ai/tutor/sessions/$sessionId');
  }

  // Generate AI quiz
  Future<ApiResponse<Map<String, dynamic>>> generateAiQuiz({
    required String subjectId,
    String? topicId,
    String? difficulty,
    required int questionCount,
    List<String>? questionTypes,
  }) async {
    return _client.post<Map<String, dynamic>>(
      '/ai/quiz-generator',
      body: {
        'subjectId': subjectId,
        'topicId': topicId,
        'difficulty': difficulty,
        'questionCount': questionCount,
        'questionTypes': questionTypes,
      },
    );
  }

  // Generate AI study plan
  Future<ApiResponse<Map<String, dynamic>>> generateAiStudyPlan({
    required String subjectId,
    double? targetScore,
    required int availableHoursPerDay,
    String? examDate,
  }) async {
    return _client.post<Map<String, dynamic>>(
      '/ai/study-plan',
      body: {
        'subjectId': subjectId,
        'targetScore': targetScore,
        'availableHoursPerDay': availableHoursPerDay,
        'examDate': examDate,
      },
    );
  }

  // Get AI explanation
  Future<ApiResponse<AiExplanation>> getAiExplanation({
    required String question,
    String? subjectId,
    String? topicId,
    String? level,
  }) async {
    return _client.post<AiExplanation>(
      '/ai/explain',
      body: {
        'question': question,
        'subjectId': subjectId,
        'topicId': topicId,
        'level': level,
      },
      fromJson: AiExplanation.fromJson,
    );
  }

  // Generate AI flashcards
  Future<ApiResponse<List<AiFlashcard>>> generateAiFlashcards({
    required String subjectId,
    String? topicId,
    required int count,
  }) async {
    return _client.post<List<AiFlashcard>>(
      '/ai/flashcards',
      body: {
        'subjectId': subjectId,
        'topicId': topicId,
        'count': count,
      },
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => AiFlashcard.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Generate AI summary
  Future<ApiResponse<AiSummary>> generateAiSummary({
    required String content,
    required String type,
    String? length,
  }) async {
    return _client.post<AiSummary>(
      '/ai/summarize',
      body: {
        'content': content,
        'type': type,
        'length': length,
      },
      fromJson: AiSummary.fromJson,
    );
  }

  // Get AI usage stats
  Future<ApiResponse<AiUsageStats>> getAiUsageStats() async {
    return _client.get<AiUsageStats>(
      '/ai/usage',
      fromJson: AiUsageStats.fromJson,
    );
  }
}
