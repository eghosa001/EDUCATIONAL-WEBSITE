import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class TeacherDashboardPage extends StatelessWidget {
  const TeacherDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Teacher Dashboard')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome
            Text('Welcome, Teacher', style: theme.textTheme.headlineSmall),
            Text('Here\'s your overview', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
            const SizedBox(height: 24),

            // Stats
            _TeacherStats(),
            const SizedBox(height: 24),

            // Quick actions
            Text('Quick Actions', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _QuickActions(),
            const SizedBox(height: 24),

            // My Courses
            Text('My Courses', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _CourseList(),
            const SizedBox(height: 24),

            // Pending Submissions
            Text('Pending Submissions', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _SubmissionsList(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        label: const Text('Create'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}

class _TeacherStats extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(icon: Icons.school, value: '12', label: 'Students'),
          _StatItem(icon: Icons.video_library, value: '48', label: 'Lessons'),
          _StatItem(icon: Icons.assignment, value: '5', label: 'Pending'),
          _StatItem(icon: Icons.attach_money, value: '₦45K', label: 'Earnings'),
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

class _QuickActions extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final actions = [
      {'icon': Icons.add_circle, 'label': 'Create Course', 'color': theme.colorScheme.primary},
      {'icon': Icons.upload_file, 'label': 'Upload Lesson', 'color': theme.colorScheme.success},
      {'icon': Icons.quiz, 'label': 'Create Quiz', 'color': theme.colorScheme.warning},
      {'icon': Icons.assignment, 'label': 'New Assignment', 'color': theme.colorScheme.secondary},
    ];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: actions.map((a) {
        return EduCard(
          onTap: () {},
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(a['icon'] as IconData, color: a['color'] as Color, size: 32),
              const SizedBox(height: 8),
              Text(a['label'] as String, style: theme.textTheme.labelMedium),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _CourseList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final courses = [
      {'title': 'SS2 Biology', 'students': 45, 'lessons': 24, 'rating': 4.8},
      {'title': 'JSS3 Mathematics', 'students': 38, 'lessons': 18, 'rating': 4.6},
      {'title': 'SS1 Physics', 'students': 32, 'lessons': 20, 'rating': 4.7},
    ];

    return Column(
      children: courses.map((c) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            onTap: () {},
            child: Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.school, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(c['title']!, style: theme.textTheme.titleSmall),
                      Text('${c['students']} students · ${c['lessons']} lessons', style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
                Row(
                  children: [
                    const Icon(Icons.star, size: 16, color: Colors.amber),
                    Text(c['rating'].toString(), style: theme.textTheme.labelSmall),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _SubmissionsList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final submissions = [
      {'student': 'Adebayo O.', 'assignment': 'Cell Diagram', 'due': 'Tomorrow', 'status': 'pending'},
      {'student': 'Fatima M.', 'assignment': 'Math Problem Set', 'due': 'In 2 days', 'status': 'pending'},
      {'student': 'Chinedu K.', 'assignment': 'Physics Lab Report', 'due': 'Dec 20', 'status': 'pending'},
    ];

    return Column(
      children: submissions.map((s) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: theme.colorScheme.primary,
                  child: Text(s['student']![0], style: theme.textTheme.labelLarge?.copyWith(color: Colors.white)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s['student']!, style: theme.textTheme.titleSmall),
                      Text(s['assignment']!, style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(s['due']!, style: theme.textTheme.labelSmall),
                    const SizedBox(height: 4),
                    EduBadge(label: 'Pending', backgroundColor: theme.colorScheme.warning, textColor: Colors.white),
                  ],
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
