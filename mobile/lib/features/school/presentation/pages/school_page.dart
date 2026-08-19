import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../di/index.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/index.dart';

class SchoolPage extends ConsumerStatefulWidget {
  const SchoolPage({super.key});

  @override
  ConsumerState<SchoolPage> createState() => _SchoolPageState();
}

class _SchoolPageState extends ConsumerState<SchoolPage> {
  Map<String, dynamic>? _school;
  Map<String, dynamic>? _stats;
  List<Map<String, dynamic>> _announcements = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final repo = ref.read(schoolRepositoryProvider);
      final schools = await repo.getSchools();

      if (schools.isNotEmpty && mounted) {
        final firstSchool = schools[0];
        final stats = await repo.getSchoolStats(firstSchool['id'] as String).catchError((_) => <String, dynamic>{});
        if (mounted) {
          setState(() {
            _school = firstSchool;
            _stats = stats;
            _isLoading = false;
          });
        }
      } else if (mounted) {
        setState(() => _isLoading = false);
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
      appBar: AppBar(title: const Text('School Portal')),
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
                      ElevatedButton(onPressed: _loadData, child: const Text('Retry')),
                    ],
                  ),
                )
              : _school == null
                  ? EduEmptyState(
                      icon: Icons.school,
                      title: 'No School Assigned',
                      subtitle: 'Join a school to access the school portal.',
                      actionLabel: 'Join School',
                      onAction: () {},
                    )
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _SchoolHeader(school: _school!),
                          const SizedBox(height: 24),
                          _SchoolStats(stats: _stats ?? _extractStats(_school!)),
                          const SizedBox(height: 24),
                          Text('Management', style: theme.textTheme.titleMedium),
                          const SizedBox(height: 8),
                          _ManagementGrid(schoolId: _school!['id'] as String?),
                          const SizedBox(height: 24),
                          Text('Announcements', style: theme.textTheme.titleMedium),
                          const SizedBox(height: 8),
                          _AnnouncementList(),
                        ],
                      ),
                    ),
    );
  }

  Map<String, dynamic> _extractStats(Map<String, dynamic> school) {
    return {
      'studentCount': (school['studentCount'] as num?)?.toInt() ?? 0,
      'teacherCount': (school['teacherCount'] as num?)?.toInt() ?? 0,
      'classCount': (school['classCount'] as num?)?.toInt() ?? 0,
      'subjectCount': (school['subjectCount'] as num?)?.toInt() ?? 0,
    };
  }
}

class _SchoolHeader extends StatelessWidget {
  final Map<String, dynamic> school;
  const _SchoolHeader({required this.school});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        children: [
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(color: theme.colorScheme.primary, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.school, color: Colors.white, size: 32),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(school['name'] as String? ?? 'School', style: theme.textTheme.titleLarge),
                Text(school['location'] ?? school['address'] ?? '', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
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
  final Map<String, dynamic> stats;
  const _SchoolStats({required this.stats});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(icon: Icons.people, value: '${stats['studentCount'] ?? 0}', label: 'Students'),
          _StatItem(icon: Icons.person, value: '${stats['teacherCount'] ?? 0}', label: 'Teachers'),
          _StatItem(icon: Icons.class_, value: '${stats['classCount'] ?? 0}', label: 'Classes'),
          _StatItem(icon: Icons.subject, value: '${stats['subjectCount'] ?? 0}', label: 'Subjects'),
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
  final String? schoolId;
  const _ManagementGrid({required this.schoolId});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = [
      {'icon': Icons.people, 'label': 'Students', 'route': schoolId != null ? '/school/$schoolId/students' : null},
      {'icon': Icons.person, 'label': 'Teachers', 'route': schoolId != null ? '/school/$schoolId/teachers' : null},
      {'icon': Icons.class_, 'label': 'Classes', 'route': schoolId != null ? '/school/$schoolId/classes' : null},
      {'icon': Icons.schedule, 'label': 'Timetable', 'route': schoolId != null ? '/school/$schoolId/timetable' : null},
      {'icon': Icons.assignment, 'label': 'Assignments', 'route': null},
      {'icon': Icons.quiz, 'label': 'Exams', 'route': null},
      {'icon': Icons.assessment, 'label': 'Results', 'route': schoolId != null ? '/school/$schoolId/results' : null},
      {'icon': Icons.attendance, 'label': 'Attendance', 'route': schoolId != null ? '/school/$schoolId/attendance' : null},
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 4,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 0.9,
      children: items.map((item) {
        final route = item['route'] as String?;
        return EduCard(
          onTap: route != null ? () => context.push(route) : null,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(item['icon'] as IconData, color: theme.colorScheme.primary, size: 32),
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
  const _AnnouncementList();

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
