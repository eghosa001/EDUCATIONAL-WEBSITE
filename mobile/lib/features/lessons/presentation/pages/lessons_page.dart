import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';

class LessonsPage extends ConsumerStatefulWidget {
  final String courseId;

  const LessonsPage({super.key, required this.courseId});

  @override
  ConsumerState<LessonsPage> createState() => _LessonsPageState();
}

class _LessonsPageState extends ConsumerState<LessonsPage> {
  List<Map<String, dynamic>> _lessons = [];
  bool _isLoading = true;
  String? _error;
  String? _courseTitle;

  @override
  void initState() {
    super.initState();
    _loadLessons();
  }

  Future<void> _loadLessons() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final repo = ref.read(lessonRepositoryProvider);
      final result = await repo.getLessons(courseId: widget.courseId);
      if (mounted) {
        setState(() {
          _lessons = result;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(_courseTitle ?? 'Lessons'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadLessons),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
                      const SizedBox(height: 16),
                      Text(_error!, style: theme.textTheme.bodyMedium),
                      const SizedBox(height: 16),
                      ElevatedButton(onPressed: _loadLessons, child: const Text('Retry')),
                    ],
                  ),
                )
              : _lessons.isEmpty
                  ? EduEmptyState(
                      icon: Icons.lesson,
                      title: 'No lessons yet',
                      subtitle: 'Lessons for this course will appear here',
                    )
                  : RefreshIndicator(
                      onRefresh: _loadLessons,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _lessons.length,
                        itemBuilder: (context, index) {
                          final lesson = _lessons[index];
                          return _LessonItem(
                            index: index + 1,
                            title: lesson['title'] as String? ?? 'Untitled Lesson',
                            duration: '${(lesson['estimatedMinutes'] as num? ?? 15).toInt()} min',
                            isCompleted: lesson['isCompleted'] == true,
                            isPublished: lesson['isPublished'] != false,
                            onPress: lesson['isPublished'] == true
                                ? () => context.push('/lessons/${widget.courseId}/${lesson['id']}')
                                : null,
                          );
                        },
                      ),
                    ),
    );
  }
}

class _LessonItem extends StatelessWidget {
  final int index;
  final String title;
  final String duration;
  final bool isCompleted;
  final bool isPublished;
  final VoidCallback? onPress;

  const _LessonItem({
    required this.index,
    required this.title,
    required this.duration,
    required this.isCompleted,
    required this.isPublished,
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
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: isCompleted
                    ? theme.colorScheme.success
                    : isPublished ? theme.colorScheme.primary : Colors.grey,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isCompleted ? Icons.check : isPublished ? Icons.play_arrow : Icons.lock,
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
                      color: isPublished ? null : theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.schedule, size: 14, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(duration, style: theme.textTheme.labelSmall),
                    ],
                  ),
                ],
              ),
            ),
            if (isPublished) Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}
