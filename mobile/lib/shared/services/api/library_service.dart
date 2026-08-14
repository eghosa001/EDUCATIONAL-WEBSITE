import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'library_service.g.dart';

@JsonSerializable()
class LibraryResource {
  final String id;
  final String title;
  final String resourceType;
  final String fileUrl;
  final int? fileSizeBytes;
  final String? mimeType;
  final String? description;
  final bool isDownloadable;
  final String? lessonId;
  final String? lessonTitle;
  final String? courseId;
  final String? courseTitle;
  final String? subjectId;
  final String? classId;
  final String createdAt;

  const LibraryResource({
    required this.id,
    required this.title,
    required this.resourceType,
    required this.fileUrl,
    this.fileSizeBytes,
    this.mimeType,
    this.description,
    required this.isDownloadable,
    this.lessonId,
    this.lessonTitle,
    this.courseId,
    this.courseTitle,
    this.subjectId,
    this.classId,
    required this.createdAt,
  });

  factory LibraryResource.fromJson(Map<String, dynamic> json) => _$LibraryResourceFromJson(json);
  Map<String, dynamic> toJson() => _$LibraryResourceToJson(this);
}

@JsonSerializable()
class LibraryStats {
  final int totalResources;
  final int pastQuestions;
  final int totalSubjects;
  final int publishedCourses;

  const LibraryStats({
    required this.totalResources,
    required this.pastQuestions,
    required this.totalSubjects,
    required this.publishedCourses,
  });

  factory LibraryStats.fromJson(Map<String, dynamic> json) => _$LibraryStatsFromJson(json);
  Map<String, dynamic> toJson() => _$LibraryStatsToJson(this);
}

class LibraryService {
  final ApiClient _client;

  LibraryService({ApiClient? client}) : _client = client ?? ApiClient();

  // List library resources
  Future<ApiResponse<List<LibraryResource>>> listLibraryResources({
    int page = 1,
    int limit = 20,
    String? resourceType,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (resourceType != null) queryParams['resourceType'] = resourceType;
    if (search != null) queryParams['search'] = search;

    return _client.get<List<LibraryResource>>(
      '/library',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => LibraryResource.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get library stats
  Future<ApiResponse<LibraryStats>> getLibraryStats() async {
    return _client.get<LibraryStats>(
      '/library/stats',
      fromJson: LibraryStats.fromJson,
    );
  }

  // Get library resource by ID
  Future<ApiResponse<LibraryResource>> getLibraryResource(String resourceId) async {
    return _client.get<LibraryResource>(
      '/library/$resourceId',
      fromJson: LibraryResource.fromJson,
    );
  }
}
