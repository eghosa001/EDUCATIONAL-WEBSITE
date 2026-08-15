import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class LessonDetailPage extends StatelessWidget {
  final String courseId;
  final String lessonId;

  const LessonDetailPage({
    super.key,
    required this.courseId,
    required this.lessonId,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App bar
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
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.play_circle_filled, size: 64, color: Colors.white54),
                      const SizedBox(height: 8),
                      const Text(
                        'Video Lesson',
                        style: TextStyle(color: Colors.white70),
                      ),
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

          // Lesson content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    'Cell Structure & Function',
                    style: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'SS2 Biology - Module 1',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Progress indicator
                  Row(
                    children: [
                      Expanded(
                        child: EduProgressBar(progress: 0.25),
                      ),
                      const SizedBox(width: 8),
                      Text('25%', style: theme.textTheme.labelLarge),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Learning objectives
                  Text(
                    'Learning Objectives',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  _ObjectiveItem(text: 'Identify the main parts of a cell'),
                  _ObjectiveItem(text: 'Describe the function of each organelle'),
                  _ObjectiveItem(text: 'Differentiate between plant and animal cells'),
                  _ObjectiveItem(text: 'Understand cell membrane transport'),
                  const SizedBox(height: 24),

                  // Lesson notes
                  Text(
                    'Lesson Notes',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  EduCard(
                    child: const Text(
                      'Cells are the basic building blocks of all living things. They perform all the functions necessary for life. There are two main types of cells: prokaryotic and eukaryotic...',
                      style: TextStyle(fontSize: 14),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Resources
                  Text(
                    'Resources',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  _ResourceItem(icon: Icons.picture_as_pdf, title: 'Cell Diagram PDF', size: '2.4 MB'),
                  _ResourceItem(icon: Icons.image, title: 'Cell Structure Image', size: '1.1 MB'),
                  _ResourceItem(icon: Icons.note, title: 'Study Notes', size: '540 KB'),
                  const SizedBox(height: 24),

                  // Quiz
                  Text(
                    'Quiz',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  EduCard(
                    child: Row(
                      children: [
                        const Icon(Icons.quiz, color: Colors.blue),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('5 Questions', style: TextStyle(fontSize: 14)),
                              Text('10 minutes', style: theme.textTheme.labelSmall),
                            ],
                          ),
                        ),
                        EduButton(
                          label: 'Start',
                          width: 80,
                          height: 36,
                          onPressed: () => context.push('/quizzes/1'),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Navigation buttons
                  Row(
                    children: [
                      Expanded(
                        child: EduButton(
                          label: 'Previous Lesson',
                          isOutlined: true,
                          onPressed: () {},
                          textColor: theme.colorScheme.primary,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: EduButton(
                          label: 'Next Lesson',
                          onPressed: () {},
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ObjectiveItem extends StatelessWidget {
  final String text;

  const _ObjectiveItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          const Icon(Icons.check_circle, size: 18, color: Colors.green),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
        ],
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
                  Text(size, style: theme.textTheme.labelSmall),
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
