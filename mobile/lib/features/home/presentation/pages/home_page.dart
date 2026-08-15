import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                _Header(),
                const SizedBox(height: 24),

                // Welcome message
                Text(
                  'Welcome back,',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                Text(
                  'Student Name!',
                  style: theme.textTheme.headlineSmall,
                ),
                const SizedBox(height: 24),

                // Continue Learning
                _ContinueLearningSection(),
                const SizedBox(height: 24),

                // Stats cards
                _StatsRow(),
                const SizedBox(height: 24),

                // Recommended Courses
                _RecommendedCoursesSection(),
                const SizedBox(height: 24),

                // Upcoming Exams
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
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        CircleAvatar(
          radius: 24,
          backgroundColor: theme.colorScheme.primaryContainer,
          child: const Icon(Icons.person, color: Colors.white),
        ),
        Row(
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_outlined),
              onPressed: () {},
              badge: const Badge(child: Text('3')),
            ),
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              onPressed: () {},
            ),
          ],
        ),
      ],
    );
  }
}

class _ContinueLearningSection extends StatelessWidget {
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
            TextButton(
              onPressed: () {},
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        EduCard(
          onTap: () {},
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.biology, size: 30, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('SS2 Biology', style: theme.textTheme.titleSmall),
                    const SizedBox(height: 4),
                    Text('Cell Structure - Lesson 3', style: theme.textTheme.bodySmall),
                    const SizedBox(height: 8),
                    EduProgressBar(progress: 0.35),
                    const SizedBox(height: 4),
                    Text('35% complete', style: theme.textTheme.labelSmall),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.play_circle_filled),
                onPressed: () {},
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _StatsRow extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.play_circle,
            label: 'Lessons',
            value: '24',
            color: theme.colorScheme.primary,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.emoji_events,
            label: 'Exams',
            value: '8',
            color: theme.colorScheme.success,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _StatCard(
            icon: Icons.local_fire_department,
            label: 'Streak',
            value: '5d',
            color: theme.colorScheme.warning,
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return EduCard(
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(color: color)),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}

class _RecommendedCoursesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Recommended for You', style: theme.textTheme.titleMedium),
            TextButton(
              onPressed: () {},
              child: const Text('See All'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: List.generate(
              3,
              (i) => Padding(
                padding: const EdgeInsets.only(right: 12),
                child: SizedBox(
                  width: 160,
                  child: _CourseCardHorizontal(
                    title: i == 0 ? 'SS2 Mathematics' : i == 1 ? 'JSS3 English' : 'SS1 Physics',
                    subject: i == 0 ? 'Mathematics' : i == 1 ? 'English' : 'Physics',
                    progress: i == 0 ? 0.6 : i == 1 ? 0.3 : 0.0,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CourseCardHorizontal extends StatelessWidget {
  final String title;
  final String subject;
  final double progress;

  const _CourseCardHorizontal({
    required this.title,
    required this.subject,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      onTap: () {},
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.book, size: 40, color: Colors.white),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: theme.textTheme.titleSmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            subject,
            style: theme.textTheme.labelSmall,
          ),
          const Spacer(),
          EduProgressBar(progress: progress),
          const SizedBox(height: 4),
          Text(
            '${(progress * 100).toInt()}% complete',
            style: theme.textTheme.labelSmall,
          ),
        ],
      ),
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
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  color: theme.colorScheme.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
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
              EduButton(
                label: 'Start',
                width: 70,
                height: 36,
                onPressed: () {},
              ),
            ],
          ),
        ),
      ],
    );
  }
}
