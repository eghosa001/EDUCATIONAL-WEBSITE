import '../api/api_client.dart';
import '../api/api_config.dart';
import 'package:meta/meta.dart';

part 'course_service.g.dart';

@JsonSerializable()
class Course {
  final String id;
  final String title;
  final String? shortDescription;
  final String? fullDescription;
  final String? thumbnailUrl;
  final String? previewVideoUrl;
  final String subjectId;
  final String classId;
  final String? termId;
  final String teacherId;
  final String slug;
  final String difficulty;
  final String status;
  final double price;
  final String currency;
  final bool isFree;
  final bool isFeatured;
  final int enrollmentCount;
  final double rating;
  final int reviewCount;
  final double totalDurationHours;
  final int lessonCount;
  final String? publishedAt;
  final String createdAt;
  final String updatedAt;

  const Course({
    required this.id,
    required this.title,
    this.shortDescription,
    this.fullDescription,
    this.thumbnailUrl,
    this.previewVideoUrl,
    required this.subjectId,
    required this.classId,
    this.termId,
    required this.teacherId,
    required this.slug,
    required this.difficulty,
    required this.status,
    required this.price,
    required this.currency,
    required this.isFree,
    required this.isFeatured,
    required this.enrollmentCount,
    required this.rating,
    required this.reviewCount,
    required this.totalDurationHours,
    required this.lessonCount,
    this.publishedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Course.fromJson(Map<String, dynamic> json) => _$CourseFromJson(json);
  Map<String, dynamic> toJson() => _$CourseToJson(this);
}

@JsonSerializable()
class CourseSection {
  final String id;
  final String courseId;
  final String title;
  final String? description;
  final int orderIndex;
  final bool isActive;
  final String createdAt;
  final String updatedAt;

  const CourseSection({
    required this.id,
    required this.courseId,
    required this.title,
    this.description,
    required this.orderIndex,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CourseSection.fromJson(Map<String, dynamic> json) => _$CourseSectionFromJson(json);
  Map<String, dynamic> toJson() => _$CourseSectionToJson(this);
}

@JsonSerializable()
class CourseStats {
  final int enrollmentCount;
  final int lessonCount;

  const CourseStats({
    required this.enrollmentCount,
    required this.lessonCount,
  });

  factory CourseStats.fromJson(Map<String, dynamic> json) => _$CourseStatsFromJson(json);
  Map<String, dynamic> toJson() => _$CourseStatsToJson(this);
}

class CourseService {
  final ApiClient _client;

  CourseService({ApiClient? client}) : _client = client ?? ApiClient();

  // List courses
  Future<ApiResponse<List<Course>>> listCourses({
    int page = 1,
    int limit = 20,
    String? status,
    String? subjectId,
    String? classId,
    String? teacherId,
    String? search,
    bool? featured,
  }) async {
    final queryParams = <String, dynamic>{};
    queryParams['page'] = page;
    queryParams['limit'] = limit;
    if (status != null) queryParams['status'] = status;
    if (subjectId != null) queryParams['subjectId'] = subjectId;
    if (classId != null) queryParams['classId'] = classId;
    if (teacherId != null) queryParams['teacherId'] = teacherId;
    if (search != null) queryParams['search'] = search;
    if (featured != null) queryParams['featured'] = featured;

    return _client.get<List<Course>>(
      '/courses',
      queryParams: queryParams,
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Course.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get featured courses
  Future<ApiResponse<List<Course>>> listFeaturedCourses({
    int page = 1,
    int limit = 10,
  }) async {
    return _client.get<List<Course>>(
      '/courses/featured',
      queryParams: {'page': page, 'limit': limit},
      fromJson: (json) {
        final data = json['data'] as List<dynamic>? ?? [];
        return data.map((item) => Course.fromJson(item as Map<String, dynamic>)).toList();
      },
    );
  }

  // Get course by ID or slug
  Future<ApiResponse<Map<String, dynamic>>> getCourse(String idOrSlug) async {
    return _client.get<Map<String, dynamic>>('/courses/$idOrSlug');
  }

  // Create course
  Future<ApiResponse<Course>> createCourse({
    required String subjectId,
    required String classId,
    String? termId,
    required String title,
    String? shortDescription,
    String? fullDescription,
    String? thumbnailUrl,
    String? previewVideoUrl,
    String difficulty = 'beginner',
    double price = 0,
    String currency = 'NGN',
    bool isFree = true,
  }) async {
    return _client.post<Course>(
      '/courses',
      body: {
        'subjectId': subjectId,
        'classId': classId,
        'termId': termId,
        'title': title,
        'shortDescription': shortDescription,
        'fullDescription': fullDescription,
        'thumbnailUrl': thumbnailUrl,
        'previewVideoUrl': previewVideoUrl,
        'difficulty': difficulty,
        'price': price,
        'currency': currency,
        'isFree': isFree,
      },
      fromJson: Course.fromJson,
    );
  }

  // Update course
  Future<ApiResponse<Course>> updateCourse(
    String courseId, {
    String? title,
    String? shortDescription,
    String? fullDescription,
    String? thumbnailUrl,
    String? previewVideoUrl,
    String? difficulty,
    double? price,
    bool? isFree,
    bool? isFeatured,
  }) async {
    final body = <String, dynamic>{};
    if (title != null) body['title'] = title;
    if (shortDescription != null) body['shortDescription'] = shortDescription;
    if (fullDescription != null) body['fullDescription'] = fullDescription;
    if (thumbnailUrl != null) body['thumbnailUrl'] = thumbnailUrl;
    if (previewVideoUrl != null) body['previewVideoUrl'] = previewVideoUrl;
    if (difficulty != null) body['difficulty'] = difficulty;
    if (price != null) body['price'] = price;
    if (isFree != null) body['isFree'] = isFree;
    if (isFeatured != null) body['isFeatured'] = isFeatured;

    return _client.patch<Course>(
      '/courses/$courseId',
      body: body,
      fromJson: Course.fromJson,
    );
  }

  // Publish course
  Future<ApiResponse<Course>> publishCourse(String courseId) async {
    return _client.post<Course>(
      '/courses/$courseId/publish',
      fromJson: Course.fromJson,
    );
  }

  // Delete course
  Future<ApiResponse<void>> deleteCourse(String courseId) async {
    return _client.delete<void>('/courses/$courseId');
  }

  // Enroll in course
  Future<ApiResponse<Map<String, dynamic>>> enrollCourse(String courseId) async {
    return _client.post<Map<String, dynamic>>('/courses/$courseId/enroll');
  }

  // Unenroll from course
  Future<ApiResponse<void>> unenrollCourse(String courseId) async {
    return _client.delete<void>('/courses/$courseId/enroll');
  }

  // Get my courses
  Future<ApiResponse<List<dynamic>>> listMyCourses() async {
    return _client.get<List<dynamic>>('/courses/my');
  }

  // Get course stats
  Future<ApiResponse<CourseStats>> getCourseStats(String courseId) async {
    return _client.get<CourseStats>(
      '/courses/$courseId/stats',
      fromJson: CourseStats.fromJson,
    );
  }

  // Get course lessons
  Future<ApiResponse<List<dynamic>>> listCourseLessons(String courseId) async {
    return _client.get<List<dynamic>>('/courses/$courseId/lessons');
  }

  // Get course students
  Future<ApiResponse<List<dynamic>>> listCourseStudents(String courseId) async {
    return _client.get<List<dynamic>>('/courses/$courseId/students');
  }

  // Create course section
  Future<ApiResponse<CourseSection>> createCourseSection(
    String courseId, {
    required String title,
    String? description,
    required int orderIndex,
  }) async {
    return _client.post<CourseSection>(
      '/courses/$courseId/sections',
      body: {
        'title': title,
        'description': description,
        'orderIndex': orderIndex,
      },
      fromJson: CourseSection.fromJson,
    );
  }

  // Update course section
  Future<ApiResponse<CourseSection>> updateCourseSection(
    String courseId,
    String sectionId, {
    String? title,
    String? description,
    int? orderIndex,
    bool? isActive,
  }) async {
    final body = <String, dynamic>{};
    if (title != null) body['title'] = title;
    if (description != null) body['description'] = description;
    if (orderIndex != null) body['orderIndex'] = orderIndex;
    if (isActive != null) body['isActive'] = isActive;

    return _client.patch<CourseSection>(
      '/courses/$courseId/sections/$sectionId',
      body: body,
      fromJson: CourseSection.fromJson,
    );
  }

  // Delete course section
  Future<ApiResponse<void>> deleteCourseSection(
    String courseId,
    String sectionId,
  ) async {
    return _client.delete<void>('/courses/$courseId/sections/$sectionId');
  }
}
