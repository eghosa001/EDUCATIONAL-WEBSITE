import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/lesson_repository.dart';
import '../../../shared/models/course/course_model.dart';

final _lessonDetailFutureProvider = FutureProvider.family<Lesson, ({String courseId, String lessonId})>((ref, params) async {
  final repo = ref.read(lessonRepositoryProvider);
  return repo.getLesson(params.lessonId);
});

final _lessonProgressFutureProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, lessonId) async {
  final repo = ref.read(lessonRepositoryProvider);
  return repo.getLessonProgress(lessonId);
});

class LessonDetailPage extends ConsumerWidget {
  final String courseId;
  final String lessonId;

  const LessonDetailPage({
    super.key,
    required this.courseId,
    required this.lessonId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final lessonAsync = ref.watch(_lessonDetailFutureProvider((courseId: courseId, lessonId: lessonId)));
    final progressAsync = ref.watch(_lessonProgressFutureProvider(lessonId));

    return Scaffold(
      body: lessonAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Failed to load lesson', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              EduButton(label: 'Retry', onPressed: () => ref.invalidate(_lessonDetailFutureProvider)),
            ],
          ),
        ),
        data: (lesson) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 220,
              floating: false,
              pinned: true,
              backgroundColor: theme.colorScheme.primary,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => context.pop(),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  color: theme.colorScheme.primary,
                  child: lesson.videoUrl != null
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.play_circle_filled, size: 64, color: Colors.white54),
                              const SizedBox(height: 8),
                              const Text('Video Lesson', style: TextStyle(color: Colors.white70)),
                            ],
                          ),
                        )
                      : Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.article, size: 64, color: Colors.white.withOpacity(0.5)),
                              const SizedBox(height: 8),
                              const Text('Text Lesson', style: TextStyle(color: Colors.white70)),
                            ],
                          ),
                        ),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.bookmark_border, color: Colors.white),
                  onPressed: () {},
                ),
                IconButton(
                  icon: const Icon(Icons.share, color: Colors.white),
                  onPressed: () {},
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(lesson.title, style: theme.textTheme.titleLarge),
                    if (lesson.description != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        lesson.description!,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    progressAsync.when(
                      loading: () => const SizedBox.shrink(),
                      error: (_, __) => const SizedBox.shrink(),
                      data: (progress) {
                        final completed = progress['isCompleted'] ?? lesson.isCompleted;
                        final pct = completed ? 1.0 : 0.0;
                        return Row(
                          children: [
                            Expanded(child: EduProgressBar(progress: pct)),
                            const SizedBox(width: 8),
                            Text(completed ? 'Completed' : '0%', style: theme.textTheme.labelLarge),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 24),

                    if (lesson.durationMinutes > 0) ...[
                      Row(
                        children: [
                          const Icon(Icons.timer, size: 18, color: Colors.grey),
                          const SizedBox(width: 8),
                          Text('Duration: ${lesson.formattedDuration}', style: theme.textTheme.bodyMedium),
                        ],
                      ),
                      const SizedBox(height: 16),
                    ],

                    if (lesson.resources != null && lesson.resources!.isNotEmpty) ...[
                      Text('Resources', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      ...lesson.resources!.map((r) => _ResourceItem(
                        icon: r.type == 'pdf'
                            ? Icons.picture_as_pdf
                            : r.type == 'image'
                                ? Icons.image
                                : Icons.note,
                        title: r.fileName ?? r.description ?? 'Resource',
                        size: r.fileSize != null ? '${(r.fileSize! / 1024).toStringAsFixed(1)} KB' : '',
                      )),
                      const SizedBox(height: 24),
                    ],

                    if (lesson.quizzes != null && lesson.quizzes!.isNotEmpty) ...[
                      Text('Quiz', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      ...lesson.quizzes!.map((quiz) => EduCard(
                        child: Row(
                          children: [
                            const Icon(Icons.quiz, color: Colors.blue),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(quiz.title, style: const TextStyle(fontSize: 14)),
                                  Text('${quiz.timeLimitMinutes} minutes', style: theme.textTheme.labelSmall),
                                ],
                              ),
                            ),
                            EduButton(
                              label: 'Start',
                              width: 80,
                              height: 36,
                              onPressed: () => context.push('/quizzes/${quiz.id}'),
                            ),
                          ],
                        ),
                      )),
                      const SizedBox(height: 24),
                    ],

                    if (!lesson.isCompleted)
                      EduButton(
                        label: 'Mark as Complete',
                        onPressed: () async {
                          try {
                            await ref.read(lessonRepositoryProvider).completeLesson(lessonId);
                            ref.invalidate(_lessonProgressFutureProvider(lessonId));
                          } catch (_) {}
                        },
                      ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ResourceItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String size;

  const _ResourceItem({
    required this.icon,
    required this.title,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: EduCard(
        child: Row(
          children: [
            Icon(icon, color: theme.colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleSmall),
                  if (size.isNotEmpty) Text(size, style: theme.textTheme.labelSmall),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.download),
              onPressed: () {},
            ),
          ],
        ),
      ),
    );
  }
}
