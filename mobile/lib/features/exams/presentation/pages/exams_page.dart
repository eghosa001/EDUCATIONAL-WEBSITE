import 'package:flutter/material.dart';

class ExamsPage extends StatelessWidget {
  const ExamsPage({super.key});
  @override
  Widget build(BuildContext context) => const Scaffold(body: Center(child: Text('Exams')));
}

class ExamDetailPage extends StatelessWidget {
  final String examId;
  const ExamDetailPage({super.key, required this.examId});
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Exam: $examId')));
}

class ExamTakenPage extends StatelessWidget {
  final String examId;
  const ExamTakenPage({super.key, required this.examId});
  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Taking Exam: $examId')));
}
