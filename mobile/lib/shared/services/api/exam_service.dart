import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'exam_service.g.dart';

@JsonSerializable()
class Exam {
  final String id;
  final String title;
  final String slug;
  final String? description;
  final String examType;
  final String subjectId;
  final String classId;
  final int durationMinutes;
  final double totalMarks;
  final double passingMarks;
  final String? instructions;
  final String? startTime;
  final String? endTime;
  final bool isTimed;
  final bool shuffleQuestions;
  final bool showResultsImmediately;
  final bool allowReview;
  final int maxAttempts;
  final bool isActive;
  final bool isPublic;
  final String createdBy;
  final String createdAt;
  final String updatedAt;

  const Exam({
    required this.id,
    required this.title,
    required this.slug,
    this.description,
    required this.examType,
    required this.subjectId,
    required this.classId,
    required this.durationMinutes,
    required this.totalMarks,
    required this.passingMarks,
    this.instructions,
    this.startTime,
    this.endTime,
    required this.isTimed,
    required this.shuffleQuestions,
    required this.showResultsImmediately,
    required this.allowReview,
    required this.maxAttempts,
    required this.isActive,
    required this.isPublic,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Exam.fromJson(Map<String, dynamic> json) => _$ExamFromJson(json);
  Map<String, dynamic> toJson() => _$ExamToJson(this);
}

@JsonSerializable()
class ExamQuestion {
  final String id;
  final String examId;
  final String questionId;
  final String questionText;
  final String questionType;
  final List<dynamic> options;
  final double marks;
  final int orderIndex;
  final String? sectionName;
  final String? difficulty;
  final int? timeLimitSeconds;

  const ExamQuestion({
    required this.id,
    required this.examId,
    required this.questionId,
    required this.questionText,
    required this.questionType,
    required this.options,
    required this.marks,
    required this.orderIndex,
    this.sectionName,
    this.difficulty,
    this.timeLimitSeconds,
  });

  factory ExamQuestion.fromJson(Map<String, dynamic> json) => _$ExamQuestionFromJson(json);
  Map<String, dynamic> toJson() => _$ExamQuestionToJson(this);
}

@JsonSerializable()
class ExamAttempt {
  final String id;
  final String examId;
  final String studentId;
  final int attemptNumber;
  final String status;
  final String startedAt;
  final String? submittedAt;
  final int? timeSpentSeconds;
  final double? score;
  final double? percentage;
  final bool? isPassed;
  final int? rank;
  final int? totalStudents;
  final Map<String, dynamic> metadata;

  const ExamAttempt({
    required this.id,
    required this.examId,
    required this.studentId,
    required this.attemptNumber,
    required this.status,
    required this.startedAt,
    this.submittedAt,
    this.timeSpentSeconds,
    this.score,
    this.percentage,
    this.isPassed,
    this.rank,
    this.totalStudents,
    required this.metadata,
  });

  factory ExamAttempt.fromJson(Map<String, dynamic> json) => _$ExamAttemptFromJson(json);
  Map<String, dynamic> toJson() => _$ExamAttemptToJson(this);
}

@JsonSerializable()
class ExamResult {
  final double score;
  final double totalMarks;
  final double percentage;
  final bool isPassed;
  final int correctCount;
  final int incorrectCount;
  final int unansweredCount;
  final bool showResults;

  const ExamResult({
    required this.score,
    required this.totalMarks,
    required this.percentage,
    required this.isPassed,
    required this.correctCount,
    required this.incorrectCount,
    required this.unansweredCount,
    required this.showResults,
  });

  factory ExamResult.fromJson(Map<String, dynamic> json) => _$ExamResultFromJson(json);
  Map<String, dynamic> toJson() => _$ExamResultToJson(this);
}

class ExamService {
  final ApiClient _client;

  ExamService({ApiClient? client}) : _client = client ?? ApiClient();

  // List exams
  Future<ApiResponse<List<Exam>>> listExams({
    int page = 1,
    int limit = 20,
    String? examType,
    String? subjectId,
    String? classId,
    bool? isPublic,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (examType != null) queryParams['examType'] = examType;
    if (subjectId != null) queryParams['subjectId'] = subjectId;
    if (classId != null) queryParams['classId'] = classId;
    if (isPublic != null) queryParams['isPublic'] = isPublic;

    return _client.get<List<Exam>>(
      '/exams',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Exam.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get exam by ID
  Future<ApiResponse<Map<String, dynamic>>> getExam(String examId) async {
    return _client.get<Map<String, dynamic>>('/exams/$examId');
  }

  // Create exam
  Future<ApiResponse<Exam>> createExam({
    required String title,
    String? description,
    required String examType,
    required String subjectId,
    required String classId,
    required int durationMinutes,
    required double totalMarks,
    required double passingMarks,
    String? instructions,
    String? startTime,
    String? endTime,
    bool isTimed = true,
    bool shuffleQuestions = false,
    bool showResultsImmediately = true,
    bool allowReview = true,
    int maxAttempts = 1,
    bool isActive = false,
    bool isPublic = true,
  }) async {
    return _client.post<Exam>(
      '/exams',
      body: {
        'title': title,
        'description': description,
        'examType': examType,
        'subjectId': subjectId,
        'classId': classId,
        'durationMinutes': durationMinutes,
        'totalMarks': totalMarks,
        'passingMarks': passingMarks,
        'instructions': instructions,
        'startTime': startTime,
        'endTime': endTime,
        'isTimed': isTimed,
        'shuffleQuestions': shuffleQuestions,
        'showResultsImmediately': showResultsImmediately,
        'allowReview': allowReview,
        'maxAttempts': maxAttempts,
        'isActive': isActive,
        'isPublic': isPublic,
      },
      fromJson: Exam.fromJson,
    );
  }

  // Update exam
  Future<ApiResponse<Exam>> updateExam(
    String examId, {
    String? title,
    String? description,
    String? examType,
    int? durationMinutes,
    double? passingMarks,
    String? instructions,
    String? startTime,
    String? endTime,
    bool? isTimed,
    bool? shuffleQuestions,
    bool? showResultsImmediately,
    bool? allowReview,
    int? maxAttempts,
    bool? isActive,
    bool? isPublic,
  }) async {
    final body = <String, dynamic>{};
    if (title != null) body['title'] = title;
    if (description != null) body['description'] = description;
    if (examType != null) body['examType'] = examType;
    if (durationMinutes != null) body['durationMinutes'] = durationMinutes;
    if (passingMarks != null) body['passingMarks'] = passingMarks;
    if (instructions != null) body['instructions'] = instructions;
    if (startTime != null) body['startTime'] = startTime;
    if (endTime != null) body['endTime'] = endTime;
    if (isTimed != null) body['isTimed'] = isTimed;
    if (shuffleQuestions != null) body['shuffleQuestions'] = shuffleQuestions;
    if (showResultsImmediately != null) body['showResultsImmediately'] = showResultsImmediately;
    if (allowReview != null) body['allowReview'] = allowReview;
    if (maxAttempts != null) body['maxAttempts'] = maxAttempts;
    if (isActive != null) body['isActive'] = isActive;
    if (isPublic != null) body['isPublic'] = isPublic;

    return _client.patch<Exam>(
      '/exams/$examId',
      body: body,
      fromJson: Exam.fromJson,
    );
  }

  // Publish exam
  Future<ApiResponse<Exam>> publishExam(String examId) async {
    return _client.post<Exam>(
      '/exams/$examId/publish',
      fromJson: Exam.fromJson,
    );
  }

  // Delete exam
  Future<ApiResponse<void>> deleteExam(String examId) async {
    return _client.delete<void>('/exams/$examId');
  }

  // List exam questions
  Future<ApiResponse<List<ExamQuestion>>> listExamQuestions(String examId) async {
    return _client.get<List<ExamQuestion>>(
      '/exams/$examId/questions',
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => ExamQuestion.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Add question to exam
  Future<ApiResponse<Map<String, dynamic>>> addQuestionToExam(
    String examId, {
    required String questionId,
    int? orderIndex,
    double? marks,
    String? sectionName,
  }) async {
    final body = <String, dynamic>{};
    body['questionId'] = questionId;
    if (orderIndex != null) body['orderIndex'] = orderIndex;
    if (marks != null) body['marks'] = marks;
    if (sectionName != null) body['sectionName'] = sectionName;

    return _client.post<Map<String, dynamic>>(
      '/exams/$examId/questions',
      body: body,
    );
  }

  // Remove question from exam
  Future<ApiResponse<void>> removeQuestionFromExam(
    String examId,
    String questionId,
  ) async {
    return _client.delete<void>('/exams/$examId/questions/$questionId');
  }

  // Start exam attempt
  Future<ApiResponse<Map<String, dynamic>>> startExamAttempt(String examId) async {
    return _client.post<Map<String, dynamic>>('/exams/$examId/attempts');
  }

  // Submit exam attempt
  Future<ApiResponse<Map<String, dynamic>>> submitExamAttempt(
    String examId,
    String attemptId, {
    required List<Map<String, dynamic>> answers,
    int? timeSpentSeconds,
  }) async {
    return _client.post<Map<String, dynamic>>(
      '/exams/$examId/attempts/$attemptId/submit',
      body: {
        'answers': answers,
        'timeSpentSeconds': timeSpentSeconds,
      },
    );
  }

  // Get my exam attempts
  Future<ApiResponse<List<ExamAttempt>>> listMyExamAttempts({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get<List<ExamAttempt>>(
      '/exams/my-attempts',
      queryParams: {'page': page, 'limit': limit},
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => ExamAttempt.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // List exam attempts
  Future<ApiResponse<List<ExamAttempt>>> listExamAttempts(
    String examId, {
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get<List<ExamAttempt>>(
      '/exams/$examId/attempts',
      queryParams: {'page': page, 'limit': limit},
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => ExamAttempt.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get exam attempt
  Future<ApiResponse<Map<String, dynamic>>> getExamAttempt(
    String examId,
    String attemptId,
  ) async {
    return _client.get<Map<String, dynamic>>('/exams/$examId/attempts/$attemptId');
  }

  // Get exam leaderboard
  Future<ApiResponse<List<dynamic>>> getExamLeaderboard(String examId) async {
    return _client.get<List<dynamic>>('/exams/$examId/leaderboard');
  }
}
