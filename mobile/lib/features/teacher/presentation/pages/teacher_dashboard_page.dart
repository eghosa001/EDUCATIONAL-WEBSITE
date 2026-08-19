import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../di/index.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/index.dart';

class TeacherDashboardPage extends ConsumerStatefulWidget {
  const TeacherDashboardPage({super.key});

  @override
  ConsumerState<TeacherDashboardPage> createState() => _TeacherDashboardPageState();
}

class _TeacherDashboardPageState extends ConsumerState<TeacherDashboardPage> {
  Map<String, dynamic>? _profile;
  List<Map<String, dynamic>> _courses = [];
  List<Map<String, dynamic>> _pendingSubmissions = [];
  Map<String, dynamic>? _earnings;
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
      final repo = ref.read(teacherRepositoryProvider);
      final profile = await repo.getMyProfile().catchError((_) => <String, dynamic>{});
      final courses = await repo.getMyCourses().catchError((_) => <Map<String, dynamic>>[]);
      final pending = await repo.getPendingSubmissions().catchError((_) => <Map<String, dynamic>>[]);
      final earnings = await repo.getEarningsSummary().catchError((_) => <String, dynamic>{});

      if (mounted) {
        setState(() {
          _profile = profile;
          _courses = courses;
          _pendingSubmissions = pending;
          _earnings = earnings;
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
      appBar: AppBar(title: const Text('Teacher Dashboard')),
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
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _WelcomeSection(profile: _profile),
                      const SizedBox(height: 24),
                      _TeacherStats(profile: _profile, earnings: _earnings),
                      const SizedBox(height: 24),
                      Text('Quick Actions', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _QuickActions(),
                      const SizedBox(height: 24),
                      Text('My Courses', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _CourseList(courses: _courses),
                      const SizedBox(height: 24),
                      Text('Pending Submissions', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _SubmissionsList(submissions: _pendingSubmissions),
                    ],
                  ),
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/teacher/create'),
        label: const Text('Create'),
        icon: const Icon(Icons.add),
      ),
    );
  }
}

class _WelcomeSection extends StatelessWidget {
  final Map<String, dynamic>? profile;
  const _WelcomeSection({required this.profile});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final firstName = profile?['firstName'] ?? 'Teacher';
    final qualification = profile?['qualification'] ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Welcome, $firstName', style: theme.textTheme.headlineSmall),
        if (qualification.isNotEmpty)
          Text(qualification, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
      ],
    );
  }
}

class _TeacherStats extends StatelessWidget {
  final Map<String, dynamic>? profile;
  final Map<String, dynamic>? earnings;
  const _TeacherStats({required this.profile, required this.earnings});

  @override
  Widget build(BuildContext context) {
    final totalStudents = (profile?['totalStudents'] as num?)?.toInt() ?? 0;
    final totalCourses = (profile?['courseCount'] as num?)?.toInt() ?? 0;
    final pendingAssignments = 0;
    final totalEarnings = (earnings?['totalEarnings'] as num?)?.toInt() ?? (earnings?['balance'] as num?)?.toInt() ?? 0;

    return EduCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(icon: Icons.school, value: '$totalStudents', label: 'Students'),
          _StatItem(icon: Icons.video_library, value: '$totalCourses', label: 'Lessons'),
          _StatItem(icon: Icons.assignment, value: '$pendingAssignments', label: 'Pending'),
          _StatItem(icon: Icons.attach_money, value: '\u{20A6}$totalEarnings', label: 'Earnings'),
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
  const _QuickActions();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final actions = [
      {'icon': Icons.add_circle, 'label': 'Create Course', 'route': '/teacher/courses/new'},
      {'icon': Icons.upload_file, 'label': 'Upload Lesson', 'route': '/teacher/lessons/new'},
      {'icon': Icons.quiz, 'label': 'Create Quiz', 'route': '/teacher/quizzes/new'},
      {'icon': Icons.assignment, 'label': 'New Assignment', 'route': '/teacher/assignments/new'},
    ];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: actions.map((a) {
        return EduCard(
          onTap: () => context.push(a['route'] as String),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(a['icon'] as IconData, color: theme.colorScheme.primary, size: 32),
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
  final List<Map<String, dynamic>> courses;
  const _CourseList({required this.courses});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (courses.isEmpty) {
      return EduEmptyState(
        icon: Icons.school,
        title: 'No Courses Yet',
        subtitle: 'Create your first course to start teaching!',
      );
    }
    return Column(
      children: courses.take(5).map((c) {
        final title = c['title'] as String? ?? 'Course';
        final students = (c['studentCount'] as num?)?.toInt() ?? (c['students'] as num?)?.toInt() ?? 0;
        final lessons = (c['lessonCount'] as num?)?.toInt() ?? (c['lessons'] as num?)?.toInt() ?? 0;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            onTap: () => context.push('/teacher/courses/${c['id']}'),
            child: Row(
              children: [
                Container(
                  width: 50, height: 50,
                  decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.school, color: Colors.white),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: theme.textTheme.titleSmall),
                      Text('$students students · $lessons lessons', style: theme.textTheme.labelSmall),
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
}

class _SubmissionsList extends StatelessWidget {
  final List<Map<String, dynamic>> submissions;
  const _SubmissionsList({required this.submissions});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (submissions.isEmpty) {
      return EduEmptyState(
        icon: Icons.check_circle,
        title: 'All Caught Up!',
        subtitle: 'No pending submissions to grade.',
      );
    }
    return Column(
      children: submissions.take(5).map((s) {
        final student = s['studentName'] ?? s['student'] ?? 'Student';
        final assignment = s['assignmentTitle'] ?? s['assignment'] ?? 'Assignment';
        final dueDate = s['dueDate'] ?? s['due'] ?? '';
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: theme.colorScheme.primary,
                  child: Text(student[0], style: theme.textTheme.labelLarge?.copyWith(color: Colors.white)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(student, style: theme.textTheme.titleSmall),
                      Text(assignment, style: theme.textTheme.bodySmall),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (dueDate.isNotEmpty) Text(dueDate, style: theme.textTheme.labelSmall),
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
