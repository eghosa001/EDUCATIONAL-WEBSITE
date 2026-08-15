import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class ParentDashboardPage extends StatelessWidget {
  const ParentDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Parent Dashboard')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Child selector
            _ChildSelector(),
            const SizedBox(height: 24),

            // Overview stats
            _OverviewStats(),
            const SizedBox(height: 24),

            // Performance
            Text('Performance Overview', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _PerformanceChart(),
            const SizedBox(height: 24),

            // Weak & Strong Areas
            Row(
              children: [
                Expanded(
                  child: _AreaCard(
                    title: 'Strong Areas',
                    color: theme.colorScheme.success,
                    items: ['Mathematics', 'Biology', 'English'],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _AreaCard(
                    title: 'Needs Attention',
                    color: theme.colorScheme.warning,
                    items: ['Chemistry', 'Physics'],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Recent Activity
            Text('Recent Activity', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _ActivityList(),
          ],
        ),
      ),
    );
  }
}

class _ChildSelector extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: theme.colorScheme.primary,
            child: const Text('J', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('John Doe', style: theme.textTheme.titleMedium),
                Text('SS2 Biology - 78% average', style: theme.textTheme.bodySmall),
              ],
            ),
          ),
          DropdownButton<String>(
            value: 'John',
            items: const [
              DropdownMenuItem(value: 'John', child: Text('John')),
              DropdownMenuItem(value: 'Jane', child: Text('Jane')),
            ],
            onChanged: (_) {},
          ),
        ],
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
          _StatItem(icon: Icons.schedule, value: '14h 32m', label: 'Study Time'),
          _StatItem(icon: Icons.book, value: '6', label: 'Courses'),
          _StatItem(icon: Icons.score, value: '78%', label: 'Average'),
          _StatItem(icon: Icons.play_arrow, value: '43', label: 'Lessons'),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;

  const _StatItem({required this.icon, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 4),
        Text(value, style: Theme.of(context).textTheme.titleMedium),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _PerformanceChart extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subjects = [
      {'name': 'Math', 'score': 85},
      {'name': 'Bio', 'score': 92},
      {'name': 'Chem', 'score': 65},
      {'name': 'Phys', 'score': 71},
      {'name': 'Eng', 'score': 88},
    ];

    return EduCard(
      child: Column(
        children: subjects.map((s) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                SizedBox(width: 40, child: Text(s['name']!, style: theme.textTheme.bodySmall)),
                Expanded(
                  child: EduProgressBar(
                    progress: (s['score'] as int) / 100,
                    height: 12,
                    color: (s['score'] as int) >= 70 ? theme.colorScheme.success : theme.colorScheme.warning,
                  ),
                ),
                const SizedBox(width: 8),
                Text('${s['score']}%', style: theme.textTheme.labelSmall),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _AreaCard extends StatelessWidget {
  final String title;
  final Color color;
  final List<String> items;

  const _AreaCard({required this.title, required this.color, required this.items});

  @override
  Widget build(BuildContext context) {
    return EduCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle, color: color, size: 18),
              const SizedBox(width: 8),
              Text(title, style: Theme.of(context).textTheme.titleSmall),
            ],
          ),
          const SizedBox(height: 8),
          ...items.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: [
                Icon(Icons.circle, size: 8, color: color),
                const SizedBox(width: 8),
                Text(item, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          )),
        ],
      ),
    );
  }
}

class _ActivityList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activities = [
      {'icon': Icons.play_circle, 'text': 'Completed Biology lesson', 'time': '2 hours ago'},
      {'icon': Icons.quiz, 'text': 'Scored 85% on Math quiz', 'time': 'Yesterday'},
      {'icon': Icons.assignment, 'text': 'Submitted Physics assignment', 'time': '3 days ago'},
      {'icon': Icons.emoji_events, 'text': 'Earned "Top Student" badge', 'time': '1 week ago'},
    ];

    return Column(
      children: activities.map((a) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                Icon(a['icon'] as IconData, color: theme.colorScheme.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(a['text'] as String, style: theme.textTheme.bodyMedium),
                ),
                Text(a['time'] as String, style: theme.textTheme.labelSmall),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
