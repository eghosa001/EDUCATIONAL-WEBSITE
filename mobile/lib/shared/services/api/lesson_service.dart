import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'lesson_service.g.dart';

@JsonSerializable()
class Lesson {
  final String id;
  final String courseId;
  final String? sectionId;
  final String? topicId;
  final String? subtopicId;
  final String title;
  final String slug;
  final String? description;
  final List<String> learningObjectives;
  final String contentType;
  final String? videoUrl;
  final int? videoDurationSeconds;
  final String? videoThumbnailUrl;
  final String? writtenContent;
  final List<String> keyPoints;
  final int orderIndex;
  final bool isFree;
  final bool isPublished;
  final int estimatedMinutes;
  final int viewCount;
  final int completionCount;
  final String createdAt;
  final String updatedAt;

  const Lesson({
    required this.id,
    required this.courseId,
    this.sectionId,
    this.topicId,
    this.subtopicId,
    required this.title,
    required this.slug,
    this.description,
    required this.learningObjectives,
    required this.contentType,
    this.videoUrl,
    this.videoDurationSeconds,
    this.videoThumbnailUrl,
    this.writtenContent,
    required this.keyPoints,
    required this.orderIndex,
    required this.isFree,
    required this.isPublished,
    required this.estimatedMinutes,
    required this.viewCount,
    required this.completionCount,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) => _$LessonFromJson(json);
  Map<String, dynamic> toJson() => _$LessonToJson(this);
}

@JsonSerializable()
class LessonResource {
  final String id;
  final String lessonId;
  final String title;
  final String resourceType;
  final String fileUrl;
  final int? fileSizeBytes;
  final String? mimeType;
  final String? description;
  final bool isDownloadable;
  final int orderIndex;
  final String createdAt;

  const LessonResource({
    required this.id,
    required this.lessonId,
    required this.title,
    required this.resourceType,
    required this.fileUrl,
    this.fileSizeBytes,
    this.mimeType,
    this.description,
    required this.isDownloadable,
    required this.orderIndex,
    required this.createdAt,
  });

  factory LessonResource.fromJson(Map<String, dynamic> json) => _$LessonResourceFromJson(json);
  Map<String, dynamic> toJson() => _$LessonResourceToJson(this);
}

class LessonService {
  final ApiClient _client;

  LessonService({ApiClient? client}) : _client = client ?? ApiClient();

  // List lessons
  Future<ApiResponse<List<Lesson>>> listLessons({
    int page = 1,
    int limit = 20,
    String? courseId,
    String? sectionId,
    String? topicId,
    bool? isPublished,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (courseId != null) queryParams['courseId'] = courseId;
    if (sectionId != null) queryParams['sectionId'] = sectionId;
    if (topicId != null) queryParams['topicId'] = topicId;
    if (isPublished != null) queryParams['isPublished'] = isPublished;

    return _client.get<List<Lesson>>(
      '/lessons',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Lesson.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get lesson by ID or slug
  Future<ApiResponse<Map<String, dynamic>>> getLesson(
    String idOrSlug, {
    String? courseId,
  }) async {
    final queryParams = courseId != null ? {'courseId': courseId} : null;
    return _client.get<Map<String, dynamic>>(
      '/lessons/$idOrSlug',
      queryParams: queryParams,
    );
  }

  // Create lesson
  Future<ApiResponse<Lesson>> createLesson({
    required String courseId,
    String? sectionId,
    String? topicId,
    String? subtopicId,
    required String title,
    String? description,
    List<String>? learningObjectives,
    required String contentType,
    String? videoUrl,
    int? videoDurationSeconds,
    String? videoThumbnailUrl,
    String? writtenContent,
    List<String>? keyPoints,
    required int orderIndex,
    bool isFree = true,
    bool isPublished = false,
    required int estimatedMinutes,
  }) async {
    return _client.post<Lesson>(
      '/lessons',
      body: {
        'courseId': courseId,
        'sectionId': sectionId,
        'topicId': topicId,
        'subtopicId': subtopicId,
        'title': title,
        'description': description,
        'learningObjectives': learningObjectives,
        'contentType': contentType,
        'videoUrl': videoUrl,
        'videoDurationSeconds': videoDurationSeconds,
        'videoThumbnailUrl': videoThumbnailUrl,
        'writtenContent': writtenContent,
        'keyPoints': keyPoints,
        'orderIndex': orderIndex,
        'isFree': isFree,
        'isPublished': isPublished,
        'estimatedMinutes': estimatedMinutes,
      },
      fromJson: Lesson.fromJson,
    );
  }

  // Update lesson
  Future<ApiResponse<Lesson>> updateLesson(
    String lessonId, {
    String? title,
    String? description,
    List<String>? learningObjectives,
    String? contentType,
    String? videoUrl,
    int? videoDurationSeconds,
    String? videoThumbnailUrl,
    String? writtenContent,
    List<String>? keyPoints,
    int? orderIndex,
    bool? isFree,
    bool? isPublished,
    int? estimatedMinutes,
  }) async {
    final body = <String, dynamic>{};
    if (title != null) body['title'] = title;
    if (description != null) body['description'] = description;
    if (learningObjectives != null) body['learningObjectives'] = learningObjectives;
    if (contentType != null) body['contentType'] = contentType;
    if (videoUrl != null) body['videoUrl'] = videoUrl;
    if (videoDurationSeconds != null) body['videoDurationSeconds'] = videoDurationSeconds;
    if (videoThumbnailUrl != null) body['videoThumbnailUrl'] = videoThumbnailUrl;
    if (writtenContent != null) body['writtenContent'] = writtenContent;
    if (keyPoints != null) body['keyPoints'] = keyPoints;
    if (orderIndex != null) body['orderIndex'] = orderIndex;
    if (isFree != null) body['isFree'] = isFree;
    if (isPublished != null) body['isPublished'] = isPublished;
    if (estimatedMinutes != null) body['estimatedMinutes'] = estimatedMinutes;

    return _client.patch<Lesson>(
      '/lessons/$lessonId',
      body: body,
      fromJson: Lesson.fromJson,
    );
  }

  // Publish lesson
  Future<ApiResponse<Lesson>> publishLesson(String lessonId) async {
    return _client.post<Lesson>(
      '/lessons/$lessonId/publish',
      fromJson: Lesson.fromJson,
    );
  }

  // Delete lesson
  Future<ApiResponse<void>> deleteLesson(String lessonId) async {
    return _client.delete<void>('/lessons/$lessonId');
  }

  // Mark lesson as complete
  Future<ApiResponse<void>> markLessonComplete(String lessonId) async {
    return _client.post<void>('/lessons/$lessonId/complete');
  }

  // List lesson resources
  Future<ApiResponse<List<LessonResource>>> listLessonResources(String lessonId) async {
    return _client.get<List<LessonResource>>(
      '/lessons/$lessonId/resources',
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => LessonResource.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Create lesson resource
  Future<ApiResponse<LessonResource>> createLessonResource(
    String lessonId, {
    required String title,
    required String resourceType,
    required String fileUrl,
    int? fileSizeBytes,
    String? mimeType,
    String? description,
    bool isDownloadable = false,
    int orderIndex = 0,
  }) async {
    return _client.post<LessonResource>(
      '/lessons/$lessonId/resources',
      body: {
        'title': title,
        'resourceType': resourceType,
        'fileUrl': fileUrl,
        'fileSizeBytes': fileSizeBytes,
        'mimeType': mimeType,
        'description': description,
        'isDownloadable': isDownloadable,
        'orderIndex': orderIndex,
      },
      fromJson: LessonResource.fromJson,
    );
  }

  // Delete lesson resource
  Future<ApiResponse<void>> deleteLessonResource(
    String lessonId,
    String resourceId,
  ) async {
    return _client.delete<void>('/lessons/$lessonId/resources/$resourceId');
  }
}
