import 'package:flutter/material.dart';

class LessonDetailPage extends StatelessWidget {
  final String courseId;
  final String lessonId;
  const LessonDetailPage({super.key, required this.courseId, required this.lessonId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(child: Text('Lesson: $lessonId')),
    );
  }
}
