import '../../core/constants/app_enums.dart';
import '../../core/utils/currency_formatter.dart';

class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final UserRole role;
  final String? avatar;
  final DateTime? createdAt;
  final DateTime? lastLoginAt;
  final bool isEmailVerified;
  final Map<String, dynamic>? metadata;

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.role = UserRole.student,
    this.avatar,
    this.createdAt,
    this.lastLoginAt,
    this.isEmailVerified = false,
    this.metadata,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? json['first_name'] ?? '',
      lastName: json['lastName'] ?? json['last_name'] ?? '',
      phone: json['phone'],
      role: _parseRole(json['role']),
      avatar: json['avatar'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.tryParse(json['lastLoginAt'])
          : null,
      isEmailVerified: json['isEmailVerified'] ?? json['is_email_verified'] ?? false,
      metadata: json['metadata'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'role': role.name,
      'avatar': avatar,
      'createdAt': createdAt?.toIso8601String(),
      'lastLoginAt': lastLoginAt?.toIso8601String(),
      'isEmailVerified': isEmailVerified,
      'metadata': metadata,
    };
  }

  String get fullName => '$firstName $lastName';

  String get initial => '${firstName[0]}${lastName[0]}'.toUpperCase();

  static UserRole _parseRole(String? role) {
    switch (role) {
      case 'parent':
        return UserRole.parent;
      case 'teacher':
        return UserRole.teacher;
      case 'school':
        return UserRole.school;
      case 'contentAdmin':
        return UserRole.contentAdmin;
      case 'superAdmin':
        return UserRole.superAdmin;
      default:
        return UserRole.student;
    }
  }
}

class Student extends User {
  final String? classLevel;
  final String? schoolId;
  final double? currentGPA;
  final int? totalCourses;
  final int? completedLessons;
  final int? totalQuizzes;
  final int? correctAnswers;

  const Student({
    required String id,
    required String email,
    required String firstName,
    required String lastName,
    String? phone,
    String? avatar,
    DateTime? createdAt,
    DateTime? lastLoginAt,
    bool isEmailVerified = false,
    Map<String, dynamic>? metadata,
    this.classLevel,
    this.schoolId,
    this.currentGPA,
    this.totalCourses,
    this.completedLessons,
    this.totalQuizzes,
    this.correctAnswers,
  }) : super(
          id: id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          role: UserRole.student,
          avatar: avatar,
          createdAt: createdAt,
          lastLoginAt: lastLoginAt,
          isEmailVerified: isEmailVerified,
          metadata: metadata,
        );

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? json['first_name'] ?? '',
      lastName: json['lastName'] ?? json['last_name'] ?? '',
      phone: json['phone'],
      avatar: json['avatar'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.tryParse(json['lastLoginAt'])
          : null,
      isEmailVerified: json['isEmailVerified'] ?? false,
      classLevel: json['classLevel'] ?? json['class_level'],
      schoolId: json['schoolId'] ?? json['school_id'],
      currentGPA: json['currentGPA'] != null
          ? double.tryParse(json['currentGPA'].toString())
          : null,
      totalCourses: json['totalCourses'] ?? json['total_courses'],
      completedLessons: json['completedLessons'] ?? json['completed_lessons'],
      totalQuizzes: json['totalQuizzes'] ?? json['total_quizzes'],
      correctAnswers: json['correctAnswers'] ?? json['correct_answers'],
    );
  }

  double? get accuracyRate =>
      totalQuizzes != null && totalQuizzes! > 0
          ? (correctAnswers! / totalQuizzes! * 100)
          : null;

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json.addAll({
      'classLevel': classLevel,
      'schoolId': schoolId,
      'currentGPA': currentGPA,
      'totalCourses': totalCourses,
      'completedLessons': completedLessons,
      'totalQuizzes': totalQuizzes,
      'correctAnswers': correctAnswers,
    });
    return json;
  }
}

class Teacher extends User {
  final String? biography;
  final String? specialization;
  final int? totalCourses;
  final int? totalStudents;
  final double? averageRating;
  final int? totalReviews;
  final double? totalEarnings;
  final String? qualification;
  final String? phoneNumber;
  final String? profileImage;
  final bool? isVerified;

  const Teacher({
    required String id,
    required String email,
    required String firstName,
    required String lastName,
    String? phone,
    String? avatar,
    DateTime? createdAt,
    DateTime? lastLoginAt,
    bool isEmailVerified = false,
    Map<String, dynamic>? metadata,
    this.biography,
    this.specialization,
    this.totalCourses,
    this.totalStudents,
    this.averageRating,
    this.totalReviews,
    this.totalEarnings,
    this.qualification,
    this.phoneNumber,
    this.profileImage,
    this.isVerified,
  }) : super(
          id: id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          role: UserRole.teacher,
          avatar: avatar,
          createdAt: createdAt,
          lastLoginAt: lastLoginAt,
          isEmailVerified: isEmailVerified,
          metadata: metadata,
        );

  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? json['first_name'] ?? '',
      lastName: json['lastName'] ?? json['last_name'] ?? '',
      phone: json['phone'],
      avatar: json['avatar'] ?? json['profileImage'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.tryParse(json['lastLoginAt'])
          : null,
      biography: json['biography'],
      specialization: json['specialization'],
      totalCourses: json['totalCourses'] ?? json['total_courses'],
      totalStudents: json['totalStudents'] ?? json['total_students'],
      averageRating: json['averageRating'] != null
          ? double.tryParse(json['averageRating'].toString())
          : null,
      totalReviews: json['totalReviews'] ?? json['total_reviews'],
      totalEarnings: json['totalEarnings'] != null
          ? double.tryParse(json['totalEarnings'].toString())
          : null,
      qualification: json['qualification'],
      phoneNumber: json['phoneNumber'] ?? json['phone_number'],
      profileImage: json['profileImage'] ?? json['avatar'],
      isVerified: json['isVerified'] ?? json['is_verified'],
    );
  }

  String get earningsFormatted => CurrencyFormatter().format(totalEarnings ?? 0);

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json.addAll({
      'biography': biography,
      'specialization': specialization,
      'totalCourses': totalCourses,
      'totalStudents': totalStudents,
      'averageRating': averageRating,
      'totalReviews': totalReviews,
      'totalEarnings': totalEarnings,
      'qualification': qualification,
      'phoneNumber': phoneNumber,
      'profileImage': profileImage,
      'isVerified': isVerified,
    });
    return json;
  }
}

class Parent extends User {
  final List<String>? childrenIds;
  final String? relationship;

  const Parent({
    required String id,
    required String email,
    required String firstName,
    required String lastName,
    String? phone,
    String? avatar,
    DateTime? createdAt,
    DateTime? lastLoginAt,
    bool isEmailVerified = false,
    Map<String, dynamic>? metadata,
    this.childrenIds,
    this.relationship,
  }) : super(
          id: id,
          email: email,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
          role: UserRole.parent,
          avatar: avatar,
          createdAt: createdAt,
          lastLoginAt: lastLoginAt,
          isEmailVerified: isEmailVerified,
          metadata: metadata,
        );

  factory Parent.fromJson(Map<String, dynamic> json) {
    return Parent(
      id: json['id'] ?? '',
      email: json['email'] ?? '',
      firstName: json['firstName'] ?? json['first_name'] ?? '',
      lastName: json['lastName'] ?? json['last_name'] ?? '',
      phone: json['phone'],
      avatar: json['avatar'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      childrenIds: json['childrenIds'] != null
          ? List<String>.from(json['childrenIds'])
          : null,
      relationship: json['relationship'],
    );
  }

  @override
  Map<String, dynamic> toJson() {
    final json = super.toJson();
    json.addAll({
      'childrenIds': childrenIds,
      'relationship': relationship,
    });
    return json;
  }
}
