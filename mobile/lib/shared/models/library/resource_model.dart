class LibraryItem {
  final String id;
  final String title;
  final String? description;
  final String resourceType;
  final String? url;
  final String? subjectId;
  final String? subjectName;
  final String? classId;
  final String? className;
  final String? examBoard;
  final int? examYear;
  final bool isFree;
  final int viewCount;
  final int downloadCount;
  final String? thumbnail;
  final String? fileSize;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const LibraryItem({
    required this.id,
    required this.title,
    this.description,
    this.resourceType = 'document',
    this.url,
    this.subjectId,
    this.subjectName,
    this.classId,
    this.className,
    this.examBoard,
    this.examYear,
    this.isFree = true,
    this.viewCount = 0,
    this.downloadCount = 0,
    this.thumbnail,
    this.fileSize,
    this.createdAt,
    this.updatedAt,
  });

  factory LibraryItem.fromJson(Map<String, dynamic> json) {
    return LibraryItem(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      resourceType: json['resource_type'] ?? json['resourceType'] ?? 'document',
      url: json['url'],
      subjectId: json['subject_id'] ?? json['subjectId'],
      subjectName: json['subject_name'] ?? json['subjectName'],
      classId: json['class_id'] ?? json['classId'],
      className: json['class_name'] ?? json['className'],
      examBoard: json['exam_board'] ?? json['examBoard'],
      examYear: json['exam_year'] != null
          ? int.tryParse(json['exam_year'].toString())
          : null,
      isFree: json['is_free'] ?? json['isFree'] ?? true,
      viewCount: json['view_count'] ?? json['viewCount'] ?? 0,
      downloadCount: json['download_count'] ?? json['downloadCount'] ?? 0,
      thumbnail: json['thumbnail'],
      fileSize: json['file_size'] ?? json['fileSize'],
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'resource_type': resourceType,
      'url': url,
      'subject_id': subjectId,
      'subject_name': subjectName,
      'class_id': classId,
      'class_name': className,
      'exam_board': examBoard,
      'exam_year': examYear,
      'is_free': isFree,
      'view_count': viewCount,
      'download_count': downloadCount,
      'thumbnail': thumbnail,
      'file_size': fileSize,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
    };
  }
}
