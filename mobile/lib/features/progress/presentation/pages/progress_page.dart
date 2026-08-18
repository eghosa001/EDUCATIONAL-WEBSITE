import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';

class ProgressPage extends ConsumerStatefulWidget {
  const ProgressPage({super.key});

  @override
  ConsumerState<ProgressPage> createState() => _ProgressPageState();
}

class _ProgressPageState extends ConsumerState<ProgressPage> {
  Map<String, dynamic>? _overview;
  List<Map<String, dynamic>> _courseProgress = [];
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
      final repo = ref.read(progressRepositoryProvider);
      final overview = await repo.getOverallProgress();
      final courses = await repo.getCourseProgress(limit: 10);
      if (mounted) {
        setState(() {
          _overview = overview;
          _courseProgress = courses;
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
      appBar: AppBar(title: const Text('My Progress')),
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
                      _OverviewStats(overview: _overview),
                      const SizedBox(height: 24),
                      Text('Subject Performance', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _SubjectPerformance(overview: _overview),
                      const SizedBox(height: 24),
                      Text('Recent Courses', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _CourseProgressList(courses: _courseProgress),
                      const SizedBox(height: 24),
                      Text('Recommended for You', style: theme.textTheme.titleMedium),
                      const SizedBox(height: 8),
                      _Recommendations(overview: _overview),
                    ],
                  ),
                ),
    );
  }
}

class _OverviewStats extends StatelessWidget {
  final Map<String, dynamic>? overview;
  const _OverviewStats({required this.overview});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final enrolled = (overview?['enrolledCourses'] as num?)?.toInt() ?? 6;
    final completed = (overview?['completedLessons'] as num?)?.toInt() ?? 24;
    final avgScore = (overview?['averageExamScore'] as num?)?.toInt() ?? 78;
    final studyTime = (overview?['totalStudyTimeSeconds'] as num?)?.toInt() ?? 5200;
    final hours = studyTime ~/ 3600;
    final mins = ((studyTime % 3600) ~/ 60).toString().padLeft(2, '0');

    return EduCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(icon: Icons.play_circle, value: '$completed', label: 'Lessons', color: theme.colorScheme.primary),
          _StatItem(icon: Icons.emoji_events, value: '$avgScore%', label: 'Avg Score', color: theme.colorScheme.success),
          _StatItem(icon: Icons.timelapse, value: '$hours$h $mins m', label: 'Study Time', color: theme.colorScheme.warning),
          _StatItem(icon: Icons.school, value: '$enrolled', label: 'Enrolled', color: theme.colorScheme.secondary),
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
  const _StatItem({required this.icon, required this.value, required this.label, required this.color});

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
  final Map<String, dynamic>? overview;
  const _SubjectPerformance({required this.overview});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subjects = [
      {'name': 'Biology', 'score': 82},
      {'name': 'Chemistry', 'score': 65},
      {'name': 'Physics', 'score': 91},
      {'name': 'Mathematics', 'score': 74},
      {'name': 'English', 'score': 88},
    ];

    return Column(
      children: subjects.map((subject) {
        final score = subject['score'] as int;
        final color = score >= 80 ? theme.colorScheme.success : score >= 60 ? theme.colorScheme.warning : theme.colorScheme.error;
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              Expanded(flex: 3, child: Text(subject['name']!, style: theme.textTheme.bodyMedium)),
              Expanded(
                flex: 7,
                child: Column(
                  children: [
                    LinearProgressIndicator(value: score / 100, minHeight: 8, backgroundColor: theme.colorScheme.surfaceContainerHighest, valueColor: AlwaysStoppedAnimation(color)),
                    const SizedBox(height: 4),
                    Align(alignment: Alignment.centerRight, child: Text('$score%', style: theme.textTheme.labelSmall?.copyWith(color: color))),
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

class _CourseProgressList extends StatelessWidget {
  final List<Map<String, dynamic>> courses;
  const _CourseProgressList({required this.courses});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (courses.isEmpty) {
      return EduEmptyState(icon: Icons.school, title: 'No courses yet', subtitle: 'Enroll in courses to track your progress');
    }
    return Column(
      children: courses.take(5).map((course) {
        final progress = (course['progressPercentage'] as num?)?.toDouble() ?? 0;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            onTap: () => context.push('/courses/${course['courseId']}'),
            child: Row(
              children: [
                Container(width: 48, height: 48, decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.book, size: 24, color: Colors.white)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(course['courseTitle'] as String? ?? 'Course', style: theme.textTheme.titleSmall),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(value: progress / 100, minHeight: 6),
                      const SizedBox(height: 4),
                      Text('${progress.toInt()}% complete', style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

class _Recommendations extends StatelessWidget {
  final Map<String, dynamic>? overview;
  const _Recommendations({required this.overview});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        _RecommendationItem(
          icon: Icons.science,
          title: 'Chemistry — Organic Chemistry',
          description: 'You scored 65% on the last quiz. Review this topic.',
          color: theme.colorScheme.warning,
          onPress: () => context.push('/courses'),
        ),
        const SizedBox(height: 8),
        _RecommendationItem(
          icon: Icons.calculate,
          title: 'Mathematics — Calculus',
          description: 'Practice more problems to improve your score.',
          color: theme.colorScheme.primary,
          onPress: () => context.push('/courses'),
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
  const _RecommendationItem({required this.icon, required this.title, required this.description, required this.color, required this.onPress});

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
