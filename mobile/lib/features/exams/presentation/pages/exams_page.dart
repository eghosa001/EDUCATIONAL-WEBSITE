import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class ExamsPage extends ConsumerWidget {
  const ExamsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Exams'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'upcoming', child: Text('Upcoming')),
              const PopupMenuItem(value: 'completed', child: Text('Completed')),
              const PopupMenuItem(value: 'past', child: Text('Past Questions')),
            ],
            onSelected: (value) {},
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 5,
        itemBuilder: (context, index) {
          return _ExamCard(
            title: _getExamTitle(index),
            subject: _getSubject(index),
            duration: _getDuration(index),
            questions: 20,
            status: _getStatus(index),
            date: _getDate(index),
            onPress: () => context.push('/exams/${index + 1}'),
          );
        },
      ),
    );
  }

  String _getExamTitle(int index) {
    return ['Biology Midterm', 'Mathematics Final', 'Chemistry Quiz', 'Physics Test', 'English Exam'][index];
  }

  String _getSubject(int index) {
    return ['Biology', 'Mathematics', 'Chemistry', 'Physics', 'English'][index];
  }

  String _getDuration(int index) {
    return ['45 min', '2 hrs', '30 min', '1 hr', '1.5 hrs'][index];
  }

  String _getStatus(int index) {
    return ['upcoming', 'completed', 'upcoming', 'completed', 'past'][index];
  }

  String _getDate(int index) {
    return ['Dec 15, 2024', 'Dec 10, 2024', 'Dec 20, 2024', 'Dec 5, 2024', 'Nov 2023'][index];
  }
}

class _ExamCard extends StatelessWidget {
  final String title;
  final String subject;
  final String duration;
  final int questions;
  final String status;
  final String date;
  final VoidCallback onPress;

  const _ExamCard({
    required this.title,
    required this.subject,
    required this.duration,
    required this.questions,
    required this.status,
    required this.date,
    required this.onPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusColor = status == 'upcoming'
        ? theme.colorScheme.warning
        : status == 'completed'
            ? theme.colorScheme.success
            : theme.colorScheme.primary;

    return EduCard(
      onTap: onPress,
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  status.toUpperCase(),
                  style: theme.textTheme.labelSmall?.copyWith(color: statusColor, fontWeight: FontWeight.bold),
                ),
              ),
              const Spacer(),
              Text(date, style: theme.textTheme.labelSmall),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(subject, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          const SizedBox(height: 12),
          Row(
            children: [
              _ExamMeta(icon: Icons.timer, label: duration),
              const SizedBox(width: 16),
              _ExamMeta(icon: Icons.question_answer, label: '$questions Questions'),
            ],
          ),
          const SizedBox(height: 12),
          EduButton(
            label: status == 'upcoming' ? 'Start Exam' : status == 'completed' ? 'View Results' : 'Practice',
            onPressed: onPress,
            isOutlined: status == 'completed',
            textColor: theme.colorScheme.primary,
          ),
        ],
      ),
    );
  }
}

class _ExamMeta extends StatelessWidget {
  final IconData icon;
  final String label;

  const _ExamMeta({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}
