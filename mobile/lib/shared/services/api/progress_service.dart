import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'progress_service.g.dart';

@JsonSerializable()
class StudentOverview {
  final int enrolledCourses;
  final int completedLessons;
  final int totalStudyTimeSeconds;
  final int averageCourseProgress;
  final int examsTaken;
  final double averageExamScore;

  const StudentOverview({
    required this.enrolledCourses,
    required this.completedLessons,
    required this.totalStudyTimeSeconds,
    required this.averageCourseProgress,
    required this.examsTaken,
    required this.averageExamScore,
  });

  factory StudentOverview.fromJson(Map<String, dynamic> json) => _$StudentOverviewFromJson(json);
  Map<String, dynamic> toJson() => _$StudentOverviewToJson(this);
}

@JsonSerializable()
class CourseProgress {
  final String courseId;
  final int progressPercentage;
  final int completedLessons;
  final int totalLessons;
  final String? lastAccessedAt;
  final String? completedAt;
  final List<dynamic> lessons;

  const CourseProgress({
    required this.courseId,
    required this.progressPercentage,
    required this.completedLessons,
    required this.totalLessons,
    this.lastAccessedAt,
    this.completedAt,
    required this.lessons,
  });

  factory CourseProgress.fromJson(Map<String, dynamic> json) => _$CourseProgressFromJson(json);
  Map<String, dynamic> toJson() => _$CourseProgressToJson(this);
}

@JsonSerializable()
class StudySession {
  final String id;
  final String studentId;
  final String? courseId;
  final String? lessonId;
  final String activityType;
  final Map<String, dynamic>? metadata;
  final String startedAt;
  final String? endedAt;
  final int? durationSeconds;

  const StudySession({
    required this.id,
    required this.studentId,
    this.courseId,
    this.lessonId,
    required this.activityType,
    this.metadata,
    required this.startedAt,
    this.endedAt,
    this.durationSeconds,
  });

  factory StudySession.fromJson(Map<String, dynamic> json) => _$StudySessionFromJson(json);
  Map<String, dynamic> toJson() => _$StudySessionToJson(this);
}

class ProgressService {
  final ApiClient _client;

  ProgressService({ApiClient? client}) : _client = client ?? ApiClient();

  // Get student overview
  Future<ApiResponse<StudentOverview>> getStudentOverview() async {
    return _client.get<StudentOverview>(
      '/progress/overview',
      fromJson: StudentOverview.fromJson,
    );
  }

  // Get course progress
  Future<ApiResponse<CourseProgress>> getCourseProgress(String courseId) async {
    return _client.get<CourseProgress>(
      '/progress/courses/$courseId',
      fromJson: CourseProgress.fromJson,
    );
  }

  // Update lesson progress
  Future<ApiResponse<Map<String, dynamic>>> updateLessonProgress(
    String courseId,
    String lessonId, {
    String? status,
    int? progressPercentage,
    int? watchTimeSeconds,
    int? lastPositionSeconds,
  }) async {
    final body = <String, dynamic>{};
    if (status != null) body['status'] = status;
    if (progressPercentage != null) body['progressPercentage'] = progressPercentage;
    if (watchTimeSeconds != null) body['watchTimeSeconds'] = watchTimeSeconds;
    if (lastPositionSeconds != null) body['lastPositionSeconds'] = lastPositionSeconds;

    return _client.patch<Map<String, dynamic>>(
      '/progress/courses/$courseId/lessons/$lessonId',
      body: body,
    );
  }

  // Mark lesson as complete
  Future<ApiResponse<Map<String, dynamic>>> completeLesson(
    String courseId,
    String lessonId,
  ) async {
    return _client.post<Map<String, dynamic>>(
      '/progress/courses/$courseId/lessons/$lessonId/complete',
    );
  }

  // Start study session
  Future<ApiResponse<StudySession>> startStudySession({
    String? courseId,
    String? lessonId,
    required String activityType,
    Map<String, dynamic>? metadata,
  }) async {
    final body = <String, dynamic>{};
    if (courseId != null) body['courseId'] = courseId;
    if (lessonId != null) body['lessonId'] = lessonId;
    body['activityType'] = activityType;
    if (metadata != null) body['metadata'] = metadata;

    return _client.post<StudySession>(
      '/progress/sessions',
      body: body,
      fromJson: StudySession.fromJson,
    );
  }

  // End study session
  Future<ApiResponse<StudySession>> endStudySession(String sessionId) async {
    return _client.post<StudySession>(
      '/progress/sessions/$sessionId/end',
      fromJson: StudySession.fromJson,
    );
  }

  // List study sessions
  Future<ApiResponse<List<StudySession>>> listStudySessions({
    int page = 1,
    int limit = 20,
  }) async {
    return _client.get<List<StudySession>>(
      '/progress/sessions',
      queryParams: {'page': page, 'limit': limit},
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => StudySession.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }
}
