import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'question_service.g.dart';

@JsonSerializable()
class Question {
  final String id;
  final String? subjectId;
  final String? topicId;
  final String? subtopicId;
  final String? classId;
  final String questionType;
  final String questionText;
  final String? questionImageUrl;
  final List<dynamic> options;
  final dynamic correctAnswer;
  final String? explanation;
  final String? explanationImageUrl;
  final String difficulty;
  final double marks;
  final double negativeMarks;
  final int? timeLimitSeconds;
  final String? source;
  final int? examYear;
  final String? examName;
  final List<String> tags;
  final bool isActive;
  final int usageCount;
  final String? createdBy;
  final String? reviewedBy;
  final String? reviewedAt;
  final String createdAt;
  final String updatedAt;

  const Question({
    required this.id,
    this.subjectId,
    this.topicId,
    this.subtopicId,
    this.classId,
    required this.questionType,
    required this.questionText,
    this.questionImageUrl,
    required this.options,
    required this.correctAnswer,
    this.explanation,
    this.explanationImageUrl,
    required this.difficulty,
    required this.marks,
    required this.negativeMarks,
    this.timeLimitSeconds,
    this.source,
    this.examYear,
    this.examName,
    required this.tags,
    required this.isActive,
    required this.usageCount,
    this.createdBy,
    this.reviewedBy,
    this.reviewedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Question.fromJson(Map<String, dynamic> json) => _$QuestionFromJson(json);
  Map<String, dynamic> toJson() => _$QuestionToJson(this);
}

class QuestionService {
  final ApiClient _client;

  QuestionService({ApiClient? client}) : _client = client ?? ApiClient();

  // List questions
  Future<ApiResponse<List<Question>>> listQuestions({
    int page = 1,
    int limit = 20,
    String? subjectId,
    String? topicId,
    String? classId,
    String? difficulty,
    String? questionType,
    String? examName,
    int? examYear,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (subjectId != null) queryParams['subjectId'] = subjectId;
    if (topicId != null) queryParams['topicId'] = topicId;
    if (classId != null) queryParams['classId'] = classId;
    if (difficulty != null) queryParams['difficulty'] = difficulty;
    if (questionType != null) queryParams['questionType'] = questionType;
    if (examName != null) queryParams['examName'] = examName;
    if (examYear != null) queryParams['examYear'] = examYear;
    if (search != null) queryParams['search'] = search;

    return _client.get<List<Question>>(
      '/questions',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Question.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get question by ID
  Future<ApiResponse<Question>> getQuestion(String questionId) async {
    return _client.get<Question>(
      '/questions/$questionId',
      fromJson: Question.fromJson,
    );
  }

  // Create question
  Future<ApiResponse<Question>> createQuestion({
    String? subjectId,
    String? topicId,
    String? subtopicId,
    String? classId,
    required String questionType,
    required String questionText,
    String? questionImageUrl,
    List<dynamic>? options,
    required dynamic correctAnswer,
    String? explanation,
    String? explanationImageUrl,
    required String difficulty,
    required double marks,
    double negativeMarks = 0,
    int? timeLimitSeconds,
    String? source,
    int? examYear,
    String? examName,
    List<String>? tags,
  }) async {
    return _client.post<Question>(
      '/questions',
      body: {
        'subjectId': subjectId,
        'topicId': topicId,
        'subtopicId': subtopicId,
        'classId': classId,
        'questionType': questionType,
        'questionText': questionText,
        'questionImageUrl': questionImageUrl,
        'options': options,
        'correctAnswer': correctAnswer,
        'explanation': explanation,
        'explanationImageUrl': explanationImageUrl,
        'difficulty': difficulty,
        'marks': marks,
        'negativeMarks': negativeMarks,
        'timeLimitSeconds': timeLimitSeconds,
        'source': source,
        'examYear': examYear,
        'examName': examName,
        'tags': tags,
      },
      fromJson: Question.fromJson,
    );
  }

  // Bulk import questions
  Future<ApiResponse<List<Question>>> bulkImportQuestions(
    List<Map<String, dynamic>> questions,
  ) async {
    return _client.post<List<Question>>(
      '/questions/bulk',
      body: {'questions': questions},
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Question.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Update question
  Future<ApiResponse<Question>> updateQuestion(
    String questionId, {
    String? questionText,
    String? questionImageUrl,
    List<dynamic>? options,
    dynamic correctAnswer,
    String? explanation,
    String? difficulty,
    double? marks,
    bool? isActive,
  }) async {
    final body = <String, dynamic>{};
    if (questionText != null) body['questionText'] = questionText;
    if (questionImageUrl != null) body['questionImageUrl'] = questionImageUrl;
    if (options != null) body['options'] = options;
    if (correctAnswer != null) body['correctAnswer'] = correctAnswer;
    if (explanation != null) body['explanation'] = explanation;
    if (difficulty != null) body['difficulty'] = difficulty;
    if (marks != null) body['marks'] = marks;
    if (isActive != null) body['isActive'] = isActive;

    return _client.patch<Question>(
      '/questions/$questionId',
      body: body,
      fromJson: Question.fromJson,
    );
  }

  // Review question
  Future<ApiResponse<Question>> reviewQuestion(String questionId) async {
    return _client.post<Question>(
      '/questions/$questionId/review',
      fromJson: Question.fromJson,
    );
  }

  // Delete question
  Future<ApiResponse<void>> deleteQuestion(String questionId) async {
    return _client.delete<void>('/questions/$questionId');
  }

  // List past questions
  Future<ApiResponse<List<Question>>> listPastQuestions({
    int page = 1,
    int limit = 20,
    String? subjectId,
    String? classId,
    String? examName,
    int? examYear,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (subjectId != null) queryParams['subjectId'] = subjectId;
    if (classId != null) queryParams['classId'] = classId;
    if (examName != null) queryParams['examName'] = examName;
    if (examYear != null) queryParams['examYear'] = examYear;

    return _client.get<List<Question>>(
      '/library/past-questions',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Question.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get past question exams
  Future<ApiResponse<List<dynamic>>> getPastQuestionExams() async {
    return _client.get<List<dynamic>>('/library/past-questions/exams');
  }
}
