import 'package:flutter/material.dart';

class CoursesPage extends StatelessWidget {
  const CoursesPage({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Courses')));
}

class CourseDetailPage extends StatelessWidget {
  final String courseId;
  const CourseDetailPage({super.key, required this.courseId});
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Course: $courseId')));
}
