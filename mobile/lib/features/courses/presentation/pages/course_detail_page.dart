import 'package:flutter/material.dart';

class CourseDetailPage extends StatelessWidget {
  final String courseId;
  const CourseDetailPage({super.key, required this.courseId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(child: Text('Course: $courseId')),
    );
  }
}
