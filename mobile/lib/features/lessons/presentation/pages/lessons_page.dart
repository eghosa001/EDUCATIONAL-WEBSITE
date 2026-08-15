import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class LessonsPage extends StatelessWidget {
  final String courseId;

  const LessonsPage({super.key, required this.courseId});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Lessons'),
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 12,
        itemBuilder: (context, index) {
          return _LessonItem(
            index: index + 1,
            title: 'Lesson ${index + 1}: ${_getLessonTitle(index)}',
            duration: '${(index + 1) * 15} min',
            isCompleted: index < 3,
            isLocked: index > 5,
            onPress: index <= 5 ? () => context.push('/lessons/$courseId/${index + 1}') : null,
          );
        },
      ),
    );
  }

  String _getLessonTitle(int index) {
    final titles = [
      'Introduction to Cells',
      'Cell Membrane',
      'Cytoplasm & Organelles',
      'Nucleus & Genetics',
      'Cell Division',
      'Cell Energy',
      'Cell Communication',
      'Cell Specialization',
      'Tissues & Organs',
      'System Organization',
      'Cell Disorders',
      'Review & Summary',
    ];
    return index < titles.length ? titles[index] : 'Lesson ${index + 1}';
  }
}

class _LessonItem extends StatelessWidget {
  final int index;
  final String title;
  final String duration;
  final bool isCompleted;
  final bool isLocked;
  final VoidCallback? onPress;

  const _LessonItem({
    required this.index,
    required this.title,
    required this.duration,
    required this.isCompleted,
    required this.isLocked,
    this.onPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: EduCard(
        onTap: onPress,
        child: Row(
          children: [
            // Status indicator
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isCompleted
                    ? theme.colorScheme.success
                    : isLocked
                        ? Colors.grey
                        : theme.colorScheme.primary,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isCompleted ? Icons.check : isLocked ? Icons.lock : Icons.play_arrow,
                color: Colors.white,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: isLocked ? theme.colorScheme.onSurfaceVariant : null,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 14, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        duration,
                        style: theme.textTheme.labelSmall,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (!isLocked)
              Icon(
                Icons.chevron_right,
                color: theme.colorScheme.onSurfaceVariant,
              ),
          ],
        ),
      ),
    );
  }
}
