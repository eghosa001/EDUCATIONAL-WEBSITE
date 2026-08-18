import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';
import '../../core/storage/storage_service.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  List<Map<String, dynamic>> _recentCourses = [];
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _overview;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final storage = ref.read(storageServiceProvider);
      final user = storage.user;
      final name = user?['firstName'] ?? 'Student';

      final progressRepo = ref.read(progressRepositoryProvider);
      final overview = await progressRepo.getOverallProgress();
      final courses = await progressRepo.getCourseProgress(limit: 5);

      if (mounted) {
        setState(() {
          _overview = overview;
          _recentCourses = courses;
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
    final storage = ref.read(storageServiceProvider);
    final user = storage.user;
    final name = user?['firstName'] ?? 'Student';

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadData,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _Header(name: name),
                      const SizedBox(height: 24),
                      _WelcomeMessage(name: name),
                      const SizedBox(height: 24),
                      _ContinueLearningSection(
                        courses: _recentCourses,
                        isLoading: _isLoading,
                        onTap: (id) => context.push('/courses/$id'),
                      ),
                      const SizedBox(height: 24),
                      _StatsRow(overview: _overview),
                      const SizedBox(height: 24),
                      _QuickActions(theme: theme),
                      const SizedBox(height: 24),
                      _UpcomingExamsSection(),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  final String name;
  const _Header({required this.name});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: theme.colorScheme.primaryContainer,
          child: Text(
            name[0].toUpperCase(),
            style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.onPrimaryContainer),
          ),
        ),
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () => context.push('/notifications'),
            ),
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () => context.push('/profile'),
            ),
          ],
        ),
      ],
    );
  }
}

class _WelcomeMessage extends StatelessWidget {
  final String name;
  const _WelcomeMessage({required this.name});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Welcome back,', style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        Text(name, style: theme.textTheme.headlineSmall),
      ],
    );
  }
}

class _ContinueLearningSection extends StatelessWidget {
  final List<Map<String, dynamic>> courses;
  final bool isLoading;
  final Function(String) onTap;

  const _ContinueLearningSection({required this.courses, required this.isLoading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Continue Learning', style: theme.textTheme.titleMedium),
            TextButton(onPressed: () => context.push('/courses'), child: const Text('See All')),
          ],
        ),
        const SizedBox(height: 8),
        if (courses.isEmpty)
          EduEmptyState(
            icon: Icons.school,
            title: 'No courses yet',
            subtitle: 'Browse courses to start learning',
            actionLabel: 'Browse Courses',
            onAction: () => context.push('/courses'),
          )
        else
          ...courses.take(3).map((course) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: EduCard(
                  onTap: () => onTap(course['courseId'] as String? ?? course['id'] as String),
                  child: Row(
                    children: [
                      Container(
                        width: 60,
                        height: 60,
                        decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(8)),
                        child: Icon(Icons.book, size: 30, color: theme.colorScheme.onPrimaryContainer),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(course['courseTitle'] as String? ?? 'Course', style: theme.textTheme.titleSmall),
                            const SizedBox(height: 4),
                            Text('${course['completedLessons'] ?? 0}/${course['totalLessons'] ?? 0} lessons', style: theme.textTheme.bodySmall),
                            const SizedBox(height: 8),
                            LinearProgressIndicator(value: (course['progressPercentage'] as num? ?? 0) / 100, minHeight: 6),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(Icons.play_circle_filled, color: Colors.blue),
                    ],
                  ),
                ),
              )),
      ],
    );
  }
}

class _StatsRow extends StatelessWidget {
  final Map<String, dynamic>? overview;
  const _StatsRow({required this.overview});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final completedLessons = (overview?['completedLessons'] as num?)?.toInt() ?? 24;
    final avgScore = (overview?['averageExamScore'] as num?)?.toInt() ?? 78;
    final streak = (overview?['studyStreak'] as num?)?.toInt() ?? 5;

    return Row(
      children: [
        Expanded(child: _StatCard(icon: Icons.play_circle, label: 'Lessons', value: '$completedLessons', color: theme.colorScheme.primary)),
        const SizedBox(width: 12),
        Expanded(child: _StatCard(icon: Icons.emoji_events, label: 'Avg Score', value: '$avgScore%', color: theme.colorScheme.success)),
        const SizedBox(width: 12),
        Expanded(child: _StatCard(icon: Icons.local_fire_department, label: 'Streak', value: '$streakd', color: theme.colorScheme.warning)),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(value, style: theme.textTheme.titleLarge?.copyWith(color: color)),
          Text(label, style: theme.textTheme.labelSmall),
        ],
      ),
    );
  }
}

class _QuickActions extends StatelessWidget {
  final ThemeData theme;
  const _QuickActions({required this.theme});

  @override
  Widget build(BuildContext context) {
    final actions = [
      {'icon': Icons.book, 'label': 'Courses', 'route': '/courses'},
      {'icon': Icons.quiz, 'label': 'Exams', 'route': '/exams'},
      {'icon': Icons.lightbulb', 'label': 'AI Tutor', 'route': '/ai-tutor'},
      {'icon': Icons.flash_on', 'label': 'Flashcards', 'route': '/flashcards'},
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Quick Actions', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: actions.map((action) => EduChip(
            label: action['label'] as String,
            icon: action['icon'] as IconData,
            onTap: () => context.push(action['route'] as String),
          )).toList(),
        ),
      ],
    );
  }
}

class _UpcomingExamsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Upcoming Exams', style: theme.textTheme.titleMedium),
        const SizedBox(height: 8),
        EduCard(
          child: Row(
            children: [
              Container(
                width: 50, height: 50,
                decoration: BoxDecoration(color: theme.colorScheme.error.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.assignment, color: Colors.red, size: 28),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Biology Test', style: theme.textTheme.titleSmall),
                    const SizedBox(height: 4),
                    Text('Tomorrow, 10:00 AM', style: theme.textTheme.bodySmall),
                  ],
                ),
              ),
              EduButton(label: 'Start', width: 70, height: 36, onPressed: () => context.push('/exams')),
            ],
          ),
        ),
      ],
    );
  }
}
