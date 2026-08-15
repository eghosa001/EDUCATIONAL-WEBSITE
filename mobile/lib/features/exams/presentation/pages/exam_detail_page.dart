import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class ExamDetailPage extends StatefulWidget {
  final String examId;

  const ExamDetailPage({super.key, required this.examId});

  @override
  State<ExamDetailPage> createState() => _ExamDetailPageState();
}

class _ExamDetailPageState extends State<ExamDetailPage> {
  bool _isConfirmed = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam Details'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Exam title
            Text(
              'Biology Midterm Examination',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'SS2 Biology - First Term',
              style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),

            // Exam info cards
            _InfoCard(icon: Icons.timer, label: 'Duration', value: '45 minutes'),
            _InfoCard(icon: Icons.question_answer, label: 'Questions', value: '20'),
            _InfoCard(icon: Icons.star, label: 'Pass Mark', value: '50%'),
            _InfoCard(icon: Icons.calculate, label: 'Topics', value: 'Cell Biology, Genetics'),
            const SizedBox(height: 24),

            // Instructions
            Text(
              'Instructions',
              style: theme.textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            EduCard(
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _InstructionItem(text: 'Read each question carefully before answering'),
                  _InstructionItem(text: 'You cannot go back to previous questions'),
                  _InstructionItem(text: 'Each question carries equal marks'),
                  _InstructionItem(text: 'The exam will auto-submit when time is up'),
                  _InstructionItem(text: 'Make sure you have a stable internet connection'),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Start exam button
            EduButton(
              label: 'Start Exam',
              onPressed: () => context.push('/exams/${widget.examId}/take'),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoCard({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          Text(label, style: theme.textTheme.bodyMedium),
          const Spacer(),
          Text(value, style: theme.textTheme.titleSmall),
        ],
      ),
    );
  }
}

class _InstructionItem extends StatelessWidget {
  final String text;

  const _InstructionItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check, size: 16, color: Colors.green),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }
}
