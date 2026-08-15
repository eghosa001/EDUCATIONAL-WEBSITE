import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class SchoolPage extends StatelessWidget {
  const SchoolPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('School Portal')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // School info
            _SchoolHeader(),
            const SizedBox(height: 24),

            // Stats
            _SchoolStats(),
            const SizedBox(height: 24),

            // Quick menus
            Text('Management', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _ManagementGrid(),
            const SizedBox(height: 24),

            // Recent announcements
            Text('Announcements', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _AnnouncementList(),
          ],
        ),
      ),
    );
  }
}

class _SchoolHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.school, color: Colors.white, size: 32),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Federal Government College', style: theme.textTheme.titleLarge),
                Text('Lagos, Nigeria', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
    );
  }
}

class _SchoolStats extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(icon: Icons.people, value: '1,250', label: 'Students'),
          _StatItem(icon: Icons.person, value: '45', label: 'Teachers'),
          _StatItem(icon: Icons.class_, value: '32', label: 'Classes'),
          _StatItem(icon: Icons.subject, value: '18', label: 'Subjects'),
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

class _ManagementGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = [
      {'icon': Icons.people, 'label': 'Students', 'color': theme.colorScheme.primary},
      {'icon': Icons.person, 'label': 'Teachers', 'color': theme.colorScheme.success},
      {'icon': Icons.class_, 'label': 'Classes', 'color': theme.colorScheme.warning},
      {'icon': Icons.schedule, 'label': 'Timetable', 'color': theme.colorScheme.secondary},
      {'icon': Icons.assignment, 'label': 'Assignments', 'color': Colors.purple},
      {'icon': Icons.quiz, 'label': 'Exams', 'color': Colors.teal},
      {'icon': Icons.assessment, 'label': 'Results', 'color': Colors.orange},
      {'icon': Icons.attendance, 'label': 'Attendance', 'color': Colors.indigo},
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 4,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 0.9,
      children: items.map((item) {
        return EduCard(
          onTap: () {},
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(item['icon'] as IconData, color: item['color'] as Color, size: 32),
              const SizedBox(height: 8),
              Text(item['label'] as String, style: theme.textTheme.labelMedium),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _AnnouncementList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final announcements = [
      {'title': 'Mid-term Exams Schedule', 'date': 'Dec 15, 2024', 'type': 'exam'},
      {'title': 'Fee Payment Deadline', 'date': 'Dec 20, 2024', 'type': 'fee'},
      {'title': 'Sports Day Event', 'date': 'Dec 22, 2024', 'type': 'event'},
      {'title': 'Parent-Teacher Meeting', 'date': 'Jan 5, 2025', 'type': 'meeting'},
    ];

    return Column(
      children: announcements.map((a) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: _getTypeColor(a['type'] as String).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(_getTypeIcon(a['type'] as String), color: _getTypeColor(a['type'] as String)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a['title']!, style: theme.textTheme.titleSmall),
                      Text(a['date']!, style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: Colors.grey),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'exam': return Colors.red;
      case 'fee': return Colors.orange;
      case 'event': return Colors.green;
      case 'meeting': return Colors.blue;
      default: return Colors.grey;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'exam': return Icons.quiz;
      case 'fee': return Icons.payment;
      case 'event': return Icons.event;
      case 'meeting': return Icons.meeting_room;
      default: return Icons.info;
    }
  }
}
