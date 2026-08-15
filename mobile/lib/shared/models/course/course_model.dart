import '../../core/constants/app_enums.dart';

class Course {
  final String id;
  final String title;
  final String? description;
  final String? thumbnail;
  final String? instructorId;
  final String? instructorName;
  final String? instructorAvatar;
  final String category;
  final String level;
  final List<String> tags;
  final double price;
  final bool isFree;
  final bool isPremium;
  final int totalLessons;
  final int totalDurationMinutes;
  final double rating;
  final int totalStudents;
  final int totalReviews;
  final CourseStatus status;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final List<String>? prerequisites;
  final List<String>? learningOutcomes;
  final String? certificateTemplate;
  final bool isPublished;

  const Course({
    required this.id,
    required this.title,
    this.description,
    this.thumbnail,
    this.instructorId,
    this.instructorName,
    this.instructorAvatar,
    this.category = '',
    this.level = '',
    this.tags = const [],
    this.price = 0,
    this.isFree = true,
    this.isPremium = false,
    this.totalLessons = 0,
    this.totalDurationMinutes = 0,
    this.rating = 0,
    this.totalStudents = 0,
    this.totalReviews = 0,
    this.status = CourseStatus.draft,
    this.createdAt,
    this.updatedAt,
    this.prerequisites,
    this.learningOutcomes,
    this.certificateTemplate,
    this.isPublished = false,
  });

  factory Course.fromJson(Map<String, dynamic> json) {
    return Course(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      thumbnail: json['thumbnail'],
      instructorId: json['instructorId'] ?? json['instructor_id'],
      instructorName: json['instructorName'] ?? json['instructor_name'],
      instructorAvatar: json['instructorAvatar'] ?? json['instructor_avatar'],
      category: json['category'] ?? '',
      level: json['level'] ?? '',
      tags: json['tags'] != null
          ? List<String>.from(json['tags'])
          : [],
      price: json['price'] != null
          ? double.tryParse(json['price'].toString()) ?? 0
          : 0,
      isFree: json['isFree'] ?? json['is_free'] ?? false,
      isPremium: json['isPremium'] ?? json['is_premium'] ?? false,
      totalLessons: json['totalLessons'] ?? json['total_lessons'] ?? 0,
      totalDurationMinutes: json['totalDurationMinutes'] ?? json['total_duration_minutes'] ?? 0,
      rating: json['rating'] != null
          ? double.tryParse(json['rating'].toString()) ?? 0
          : 0,
      totalStudents: json['totalStudents'] ?? json['total_students'] ?? 0,
      totalReviews: json['totalReviews'] ?? json['total_reviews'] ?? 0,
      status: _parseCourseStatus(json['status']),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
      prerequisites: json['prerequisites'] != null
          ? List<String>.from(json['prerequisites'])
          : null,
      learningOutcomes: json['learningOutcomes'] != null
          ? List<String>.from(json['learningOutcomes'])
          : null,
      certificateTemplate: json['certificateTemplate'],
      isPublished: json['isPublished'] ?? json['is_published'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'thumbnail': thumbnail,
      'instructorId': instructorId,
      'instructorName': instructorName,
      'instructorAvatar': instructorAvatar,
      'category': category,
      'level': level,
      'tags': tags,
      'price': price,
      'isFree': isFree,
      'isPremium': isPremium,
      'totalLessons': totalLessons,
      'totalDurationMinutes': totalDurationMinutes,
      'rating': rating,
      'totalStudents': totalStudents,
      'totalReviews': totalReviews,
      'status': status.name,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'prerequisites': prerequisites,
      'learningOutcomes': learningOutcomes,
      'certificateTemplate': certificateTemplate,
      'isPublished': isPublished,
    };
  }

  static CourseStatus _parseCourseStatus(String? status) {
    switch (status) {
      case 'review':
        return CourseStatus.review;
      case 'approved':
        return CourseStatus.approved;
      case 'published':
        return CourseStatus.published;
      case 'archived':
        return CourseStatus.archived;
      default:
        return CourseStatus.draft;
    }
  }

  bool get isEnrolled => false;
  bool get isSaved => false;
  bool get isCompleted => false;
  double get completionPercentage => 0;
}

class CourseSection {
  final String id;
  final String courseId;
  final String title;
  final String? description;
  final int order;
  final List<Lesson> lessons;

  const CourseSection({
    required this.id,
    required this.courseId,
    required this.title,
    this.description,
    this.order = 0,
    this.lessons = const [],
  });

  factory CourseSection.fromJson(Map<String, dynamic> json) {
    return CourseSection(
      id: json['id'] ?? '',
      courseId: json['courseId'] ?? json['course_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      order: json['order'] ?? 0,
      lessons: json['lessons'] != null
          ? (json['lessons'] as List)
              .map((l) => Lesson.fromJson(l as Map<String, dynamic>))
              .toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'courseId': courseId,
      'title': title,
      'description': description,
      'order': order,
      'lessons': lessons.map((l) => l.toJson()).toList(),
    };
  }
}

class Lesson {
  final String id;
  final String courseId;
  final String title;
  final String? description;
  final String? videoUrl;
  final String? thumbnail;
  final int durationMinutes;
  final int order;
  final List<LessonResource>? resources;
  final List<Quiz>? quizzes;
  final bool isCompleted;
  final bool isPreview;
  final DateTime? completedAt;
  final DateTime? createdAt;

  const Lesson({
    required this.id,
    required this.courseId,
    required this.title,
    this.description,
    this.videoUrl,
    this.thumbnail,
    this.durationMinutes = 0,
    this.order = 0,
    this.resources,
    this.quizzes,
    this.isCompleted = false,
    this.isPreview = false,
    this.completedAt,
    this.createdAt,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    return Lesson(
      id: json['id'] ?? '',
      courseId: json['courseId'] ?? json['course_id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      videoUrl: json['videoUrl'] ?? json['video_url'],
      thumbnail: json['thumbnail'],
      durationMinutes: json['durationMinutes'] ?? json['duration_minutes'] ?? 0,
      order: json['order'] ?? 0,
      resources: json['resources'] != null
          ? (json['resources'] as List)
              .map((r) => LessonResource.fromJson(r as Map<String, dynamic>))
              .toList()
          : null,
      quizzes: json['quizzes'] != null
          ? (json['quizzes'] as List)
              .map((q) => Quiz.fromJson(q as Map<String, dynamic>))
              .toList()
          : null,
      isCompleted: json['isCompleted'] ?? json['is_completed'] ?? false,
      isPreview: json['isPreview'] ?? json['is_preview'] ?? false,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'])
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'courseId': courseId,
      'title': title,
      'description': description,
      'videoUrl': videoUrl,
      'thumbnail': thumbnail,
      'durationMinutes': durationMinutes,
      'order': order,
      'resources': resources?.map((r) => r.toJson()).toList(),
      'quizzes': quizzes?.map((q) => q.toJson()).toList(),
      'isCompleted': isCompleted,
      'isPreview': isPreview,
      'completedAt': completedAt?.toIso8601String(),
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  String get formattedDuration {
    if (durationMinutes < 60) {
      return '${durationMinutes}m';
    }
    final hours = durationMinutes ~/ 60;
    final mins = durationMinutes % 60;
    return mins > 0 ? '${hours}h ${mins}m' : '${hours}h';
  }
}

class LessonResource {
  final String id;
  final String type;
  final String url;
  final String? fileName;
  final int? fileSize;
  final String? description;

  const LessonResource({
    required this.id,
    required this.type,
    required this.url,
    this.fileName,
    this.fileSize,
    this.description,
  });

  factory LessonResource.fromJson(Map<String, dynamic> json) {
    return LessonResource(
      id: json['id'] ?? '',
      type: json['type'] ?? '',
      url: json['url'] ?? '',
      fileName: json['fileName'] ?? json['file_name'],
      fileSize: json['fileSize'] ?? json['file_size'],
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'url': url,
      'fileName': fileName,
      'fileSize': fileSize,
      'description': description,
    };
  }
}

class Quiz {
  final String id;
  final String lessonId;
  final String title;
  final int timeLimitMinutes;
  final int passingScore;
  final List<QuizQuestion> questions;
  final bool isCompleted;
  final double? score;
  final DateTime? startedAt;
  final DateTime? completedAt;

  const Quiz({
    required this.id,
    required this.lessonId,
    required this.title,
    this.timeLimitMinutes = 0,
    this.passingScore = 50,
    this.questions = const [],
    this.isCompleted = false,
    this.score,
    this.startedAt,
    this.completedAt,
  });

  factory Quiz.fromJson(Map<String, dynamic> json) {
    return Quiz(
      id: json['id'] ?? '',
      lessonId: json['lessonId'] ?? json['lesson_id'] ?? '',
      title: json['title'] ?? '',
      timeLimitMinutes: json['timeLimitMinutes'] ?? json['time_limit_minutes'] ?? 0,
      passingScore: json['passingScore'] ?? json['passing_score'] ?? 50,
      questions: json['questions'] != null
          ? (json['questions'] as List)
              .map((q) => QuizQuestion.fromJson(q as Map<String, dynamic>))
              .toList()
          : [],
      isCompleted: json['isCompleted'] ?? json['is_completed'] ?? false,
      score: json['score'] != null
          ? double.tryParse(json['score'].toString())
          : null,
      startedAt: json['startedAt'] != null
          ? DateTime.tryParse(json['startedAt'])
          : null,
      completedAt: json['completedAt'] != null
          ? DateTime.tryParse(json['completedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'lessonId': lessonId,
      'title': title,
      'timeLimitMinutes': timeLimitMinutes,
      'passingScore': passingScore,
      'questions': questions.map((q) => q.toJson()).toList(),
      'isCompleted': isCompleted,
      'score': score,
      'startedAt': startedAt?.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
    };
  }
}

class QuizQuestion {
  final String id;
  final String text;
  final String? imageUrl;
  final String type;
  final List<QuizOption> options;
  final String correctAnswerId;
  final String? explanation;

  const QuizQuestion({
    required this.id,
    required this.text,
    this.imageUrl,
    this.type = 'mcq',
    this.options = const [],
    required this.correctAnswerId,
    this.explanation,
  });

  factory QuizQuestion.fromJson(Map<String, dynamic> json) {
    return QuizQuestion(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      imageUrl: json['imageUrl'] ?? json['image_url'],
      type: json['type'] ?? 'mcq',
      options: json['options'] != null
          ? (json['options'] as List)
              .map((o) => QuizOption.fromJson(o as Map<String, dynamic>))
              .toList()
          : [],
      correctAnswerId: json['correctAnswerId'] ?? json['correct_answer_id'] ?? '',
      explanation: json['explanation'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'imageUrl': imageUrl,
      'type': type,
      'options': options.map((o) => o.toJson()).toList(),
      'correctAnswerId': correctAnswerId,
      'explanation': explanation,
    };
  }
}

class QuizOption {
  final String id;
  final String text;
  final int order;

  const QuizOption({
    required this.id,
    required this.text,
    this.order = 0,
  });

  factory QuizOption.fromJson(Map<String, dynamic> json) {
    return QuizOption(
      id: json['id'] ?? '',
      text: json['text'] ?? '',
      order: json['order'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'text': text,
      'order': order,
    };
  }
}
