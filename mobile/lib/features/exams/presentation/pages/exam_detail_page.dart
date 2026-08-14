import 'package:flutter/material.dart';

class ExamDetailPage extends StatelessWidget {
  final String examId;
  const ExamDetailPage({super.key, required this.examId});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Exam Detail')));
  }
}

class ExamTakenPage extends StatelessWidget {
  final String examId;
  const ExamTakenPage({super.key, required this.examId});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(body: Center(child: Text('Taking Exam')));
  }
}
