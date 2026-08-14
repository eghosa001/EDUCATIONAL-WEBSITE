import 'package:flutter/material.dart';

class LessonsPage extends StatelessWidget {
  final String courseId;
  const LessonsPage({super.key, required this.courseId});
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Lessons for $courseId')));
}

class LessonDetailPage extends StatelessWidget {
  final String courseId;
  final String lessonId;
  const LessonDetailPage({super.key, required this.courseId, required this.lessonId});
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Lesson: $lessonId')));
}
