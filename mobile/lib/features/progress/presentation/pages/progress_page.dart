import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class ProgressPage extends StatelessWidget {
  const ProgressPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('My Progress')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Overview stats
            _OverviewStats(),
            const SizedBox(height: 24),

            // Subject performance
            Text('Subject Performance', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _SubjectPerformance(),
            const SizedBox(height: 24),

            // Study time
            Text('Study Time', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _StudyTimeChart(),
            const SizedBox(height: 24),

            // Recent achievements
            Text('Recent Achievements', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _AchievementsList(),
            const SizedBox(height: 24),

            // Recommendations
            Text('Recommended for You', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _Recommendations(),
          ],
        ),
      ),
    );
  }
}

class _OverviewStats extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(
            icon: Icons.play_circle,
            value: '24',
            label: 'Lessons',
            color: theme.colorScheme.primary,
          ),
          _StatItem(
            icon: Icons.emoji_events,
            value: '78%',
            label: 'Avg Score',
            color: theme.colorScheme.success,
          ),
          _StatItem(
            icon: Icons.local_fire_department,
            value: '5d',
            label: 'Streak',
            color: theme.colorScheme.warning,
          ),
          _StatItem(
            icon: Icons.star,
            value: '1,250',
            label: 'XP',
            color: theme.colorScheme.secondary,
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 4),
        Text(value, style: Theme.of(context).textTheme.titleLarge),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _SubjectPerformance extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subjects = [
      {'name': 'Biology', 'score': 82, 'color': theme.colorScheme.success},
      {'name': 'Chemistry', 'score': 65, 'color': theme.colorScheme.warning},
      {'name': 'Physics', 'score': 91, 'color': theme.colorScheme.primary},
      {'name': 'Mathematics', 'score': 74, 'color': theme.colorScheme.secondary},
      {'name': 'English', 'score': 88, 'color': theme.colorScheme.info},
    ];

    return Column(
      children: subjects.map((subject) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              Expanded(
                flex: 3,
                child: Text(subject['name']!, style: theme.textTheme.bodyMedium),
              ),
              Expanded(
                flex: 7,
                child: Column(
                  children: [
                    EduProgressBar(
                      progress: (subject['score'] as int) / 100,
                      height: 8,
                      color: subject['color'] as Color,
                    ),
                    const SizedBox(height: 4),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        '${subject['score']}%',
                        style: theme.textTheme.labelSmall?.copyWith(color: subject['color'] as Color),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _StudyTimeChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final hours = [2.5, 3.0, 1.5, 4.0, 2.0, 5.0, 3.5];
    final maxHours = hours.reduce((a, b) => a > b ? a : b);

    return EduCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: days.map((day) {
          final index = days.indexOf(day);
          final height = (hours[index] / maxHours) * 100;
          return Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                width: 24,
                height: height,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(height: 4),
              Text(day, style: theme.textTheme.labelSmall),
              Text('${hours[index]}h', style: theme.textTheme.labelSmall),
            ],
          );
        }).toList(),
      ),
    );
  }
}

class _AchievementsList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final achievements = [
      {'icon': Icons.military_tech, 'title': 'First Quiz', 'description': 'Complete your first quiz'},
      {'icon': Icons.streak, 'title': '7-Day Streak', 'description': 'Study for 7 consecutive days'},
      {'icon': Icons.emoji_events, 'title': 'Top 10%', 'description': 'Score in the top 10%'},
      {'icon': Icons.workspace_premium, 'title': 'Perfect Score', 'description': 'Get 100% on any exam'},
    ];

    return Column(
      children: achievements.map((achievement) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.warning.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(achievement['icon'] as IconData, color: theme.colorScheme.warning),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(achievement['title'] as String, style: theme.textTheme.titleSmall),
                      Text(achievement['description'] as String, style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
                const Icon(Icons.check_circle, color: Colors.green),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _Recommendations extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        _RecommendationItem(
          icon: Icons.science,
          title: 'Chemistry - Organic Chemistry',
          description: 'You scored 65% on the last quiz. Review this topic.',
          color: theme.colorScheme.warning,
          onPress: () {},
        ),
        const SizedBox(height: 8),
        _RecommendationItem(
          icon: Icons.calculate,
          title: 'Mathematics - Calculus',
          description: 'Practice more problems to improve your score.',
          color: theme.colorScheme.primary,
          onPress: () {},
        ),
      ],
    );
  }
}

class _RecommendationItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final Color color;
  final VoidCallback onPress;

  const _RecommendationItem({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
    required this.onPress,
  });

  @override
  Widget build(BuildContext context) {
    return EduCard(
      onTap: onPress,
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleSmall),
                Text(description, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}
