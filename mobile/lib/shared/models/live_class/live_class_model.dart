class LiveClassStatus {
  static const String scheduled = 'scheduled';
  static const String live = 'live';
  static const String ended = 'ended';
  static const String cancelled = 'cancelled';
}

class AttendanceStatus {
  static const String joined = 'joined';
  static const String left = 'left';
  static const String attended = 'attended';
  static const String absent = 'absent';
}

class LiveClass {
  final String id;
  final String title;
  final String? description;
  final String? subjectId;
  final String? subjectTitle;
  final String? topicId;
  final String? topicTitle;
  final String teacherId;
  final String? teacherName;
  final String? teacherAvatar;
  final DateTime scheduledAt;
  final int durationMinutes;
  final int? maxParticipants;
  final String meetingUrl;
  final String status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  final AttendanceStatus? attendanceStatus;
  final DateTime? joinedAt;

  const LiveClass({
    required this.id,
    required this.title,
    this.description,
    this.subjectId,
    this.subjectTitle,
    this.topicId,
    this.topicTitle,
    required this.teacherId,
    this.teacherName,
    this.teacherAvatar,
    required this.scheduledAt,
    required this.durationMinutes,
    this.maxParticipants,
    required this.meetingUrl,
    required this.status,
    this.createdAt,
    this.updatedAt,
    this.attendanceStatus,
    this.joinedAt,
  });

  factory LiveClass.fromJson(Map<String, dynamic> json) {
    return LiveClass(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      subjectId: json['subjectId'] ?? json['subject_id'],
      subjectTitle: json['subject_title'] ?? json['subjectTitle'],
      topicId: json['topicId'] ?? json['topic_id'],
      topicTitle: json['topic_title'] ?? json['topicTitle'],
      teacherId: json['teacher_id'] ?? json['teacherId'] ?? '',
      teacherName: json['teacher_name'] ?? json['teacherName'],
      teacherAvatar: json['teacher_avatar'] ?? json['teacherAvatar'],
      scheduledAt: DateTime.tryParse(json['scheduled_at'] ?? json['scheduledAt'] ?? '') ?? DateTime.now(),
      durationMinutes: json['duration_minutes'] ?? json['durationMinutes'] ?? 0,
      maxParticipants: json['max_participants'] ?? json['maxParticipants'],
      meetingUrl: json['meeting_url'] ?? json['meetingUrl'] ?? '',
      status: json['status'] ?? 'scheduled',
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at']) : null,
      attendanceStatus: json['attendance_status'] != null
          ? _parseAttendanceStatus(json['attendance_status'])
          : null,
      joinedAt: json['joined_at'] != null ? DateTime.tryParse(json['joined_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'subject_id': subjectId,
      'subject_title': subjectTitle,
      'topic_id': topicId,
      'topic_title': topicTitle,
      'teacher_id': teacherId,
      'teacher_name': teacherName,
      'teacher_avatar': teacherAvatar,
      'scheduled_at': scheduledAt.toIso8601String(),
      'duration_minutes': durationMinutes,
      'max_participants': maxParticipants,
      'meeting_url': meetingUrl,
      'status': status,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'attendance_status': attendanceStatus?.name,
      'joined_at': joinedAt?.toIso8601String(),
    };
  }

  bool get isScheduled => status == LiveClassStatus.scheduled;
  bool get isLive => status == LiveClassStatus.live;
  bool get isEnded => status == LiveClassStatus.ended;
  bool get isCancelled => status == LiveClassStatus.cancelled;

  bool get canJoin => isScheduled || isLive;
  bool get isCurrentlyLive => isLive;
  bool get isUpcoming => isScheduled && scheduledAt.isAfter(DateTime.now());
  bool get hasStarted => scheduledAt.isBefore(DateTime.now());
  bool get isJoined => attendanceStatus == AttendanceStatus.joined;

  String get formattedDuration {
    if (durationMinutes < 60) return '${durationMinutes}m';
    final hours = durationMinutes ~/ 60;
    final mins = durationMinutes % 60;
    return mins > 0 ? '${hours}h ${mins}m' : '${hours}h';
  }

  String get formattedDate {
    return '${scheduledAt.day} ${_monthName(scheduledAt.month)} ${scheduledAt.year}';
  }

  String get formattedTime {
    return '${scheduledAt.hour.toString().padLeft(2, '0')}:${scheduledAt.minute.toString().padLeft(2, '0')}';
  }

  String get relativeTime {
    final now = DateTime.now();
    final diff = scheduledAt.difference(now);
    if (diff.inMinutes < 0) return 'Started';
    if (diff.inHours > 0) return '${diff.inHours}h left';
    return '${diff.inMinutes}m left';
  }

  static String _monthName(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return months[month - 1];
  }

  static AttendanceStatus? _parseAttendanceStatus(String? status) {
    if (status == null) return null;
    switch (status) {
      case 'joined':
        return AttendanceStatus.joined;
      case 'left':
        return AttendanceStatus.left;
      case 'attended':
        return AttendanceStatus.attended;
      case 'absent':
        return AttendanceStatus.absent;
      default:
        return null;
    }
  }
}

class LiveClassAnalytics {
  final int totalParticipants;
  final int present;
  final int leftEarly;
  final int attended;
  final int avgDurationSeconds;

  const LiveClassAnalytics({
    required this.totalParticipants,
    required this.present,
    required this.leftEarly,
    required this.attended,
    required this.avgDurationSeconds,
  });

  factory LiveClassAnalytics.fromJson(Map<String, dynamic> json) {
    return LiveClassAnalytics(
      totalParticipants: json['total_participants'] ?? 0,
      present: json['present'] ?? 0,
      leftEarly: json['left_early'] ?? 0,
      attended: json['attended'] ?? 0,
      avgDurationSeconds: json['avg_duration_seconds'] ?? 0,
    );
  }

  int get avgDurationMinutes => avgDurationSeconds ~/ 60;
}

class ChatMessage {
  final String id;
  final String userId;
  final String userName;
  final String? userAvatar;
  final String content;
  final DateTime sentAt;

  const ChatMessage({
    required this.id,
    required this.userId,
    required this.userName,
    this.userAvatar,
    required this.content,
    required this.sentAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] ?? '',
      userId: json['user_id'] ?? json['userId'] ?? '',
      userName: json['user_name'] ?? json['userName'] ?? 'Anonymous',
      userAvatar: json['user_avatar'] ?? json['userAvatar'],
      content: json['content'] ?? '',
      sentAt: DateTime.tryParse(json['sent_at'] ?? json['sentAt'] ?? '') ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'user_name': userName,
      'user_avatar': userAvatar,
      'content': content,
      'sent_at': sentAt.toIso8601String(),
    };
  }

  bool get isMe => false;
}

class PaginatedResponse<T> {
  final List<T> data;
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  const PaginatedResponse({
    required this.data,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory PaginatedResponse.fromJson(
    List<dynamic> jsonList,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    return PaginatedResponse(
      data: jsonList.map((e) => fromJson(e as Map<String, dynamic>)).toList(),
      page: 1,
      limit: jsonList.length,
      total: jsonList.length,
      totalPages: 1,
    );
  }
}
