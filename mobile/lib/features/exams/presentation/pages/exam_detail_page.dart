import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/exam_repository.dart';

final _examDetailFutureProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, examId) async {
  final repo = ref.read(examRepositoryProvider);
  return repo.getExam(examId);
});

class ExamDetailPage extends ConsumerWidget {
  final String examId;

  const ExamDetailPage({super.key, required this.examId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final examAsync = ref.watch(_examDetailFutureProvider(examId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Exam Details'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: examAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Failed to load exam details', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              EduButton(label: 'Retry', onPressed: () => ref.invalidate(_examDetailFutureProvider(examId))),
            ],
          ),
        ),
        data: (exam) {
          final title = exam['title'] ?? 'Exam';
          final description = exam['description'] ?? '';
          final duration = exam['duration'] ?? exam['durationMinutes'] ?? 0;
          final totalMarks = exam['totalMarks'] ?? exam['passMark'] ?? 0;
          final passMark = exam['passMark'] ?? exam['pass_mark'] ?? 0;
          final instructions = exam['instructions'] as String?;
          final settings = exam['settings'] as Map<String, dynamic>?;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: theme.textTheme.headlineSmall),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    description,
                    style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
                const SizedBox(height: 24),
                _InfoCard(icon: Icons.timer, label: 'Duration', value: '$duration minutes'),
                _InfoCard(icon: Icons.star, label: 'Total Marks', value: '$totalMarks'),
                _InfoCard(icon: Icons.check_circle, label: 'Pass Mark', value: '$passMark'),
                if (settings != null) ...[
                  if (settings['shuffle'] == true)
                    _InfoCard(icon: Icons.shuffle, label: 'Shuffle', value: 'Yes'),
                  if (settings['maxAttempts'] != null)
                    _InfoCard(icon: Icons.replay, label: 'Max Attempts', value: '${settings['maxAttempts']}'),
                ],
                const SizedBox(height: 24),
                if (instructions != null && instructions.isNotEmpty) ...[
                  Text('Instructions', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  EduCard(
                    child: Text(instructions, style: const TextStyle(fontSize: 14, height: 1.5)),
                  ),
                  const SizedBox(height: 24),
                ],
                EduButton(
                  label: 'Start Exam',
                  onPressed: () => context.push('/exams/$examId/take'),
                ),
              ],
            ),
          );
        },
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
