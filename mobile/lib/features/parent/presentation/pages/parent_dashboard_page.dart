import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';

class ParentDashboardPage extends ConsumerStatefulWidget {
  const ParentDashboardPage({super.key});

  @override
  ConsumerState<ParentDashboardPage> createState() => _ParentDashboardPageState();
}

class _ParentDashboardPageState extends ConsumerState<ParentDashboardPage> {
  List<Map<String, dynamic>> _children = [];
  Map<String, dynamic>? _selectedChild;
  Map<String, dynamic>? _performance;
  List<Map<String, dynamic>> _courses = [];
  List<Map<String, dynamic>> _activities = [];
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
      final repo = ref.read(parentRepositoryProvider);
      final children = await repo.getChildren();
      if (mounted && children.isNotEmpty) {
        final firstChild = children[0];
        setState(() {
          _children = children;
          _selectedChild = firstChild;
        });
        await _loadChildData(firstChild['id'] as String? ?? '');
      } else if (mounted) {
        setState(() => _children = []);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadChildData(String childId) async {
    if (childId.isEmpty) return;
    try {
      final repo = ref.read(parentRepositoryProvider);
      final results = await Future.wait([
        repo.getChildPerformance(childId).catchError((_) => <String, dynamic>{}),
        repo.getChildCourses(childId).catchError((_) => <Map<String, dynamic>>[]),
        repo.getChildren().catchError((_) => <Map<String, dynamic>>[]),
      ]);
      if (mounted) {
        setState(() {
          _performance = results[0] as Map<String, dynamic>? ?? {};
          _courses = results[1] as List<Map<String, dynamic>>;
        });
      }
    } catch (_) {}
  }

  Future<void> _selectChild(Map<String, dynamic> child) async {
    setState(() => _selectedChild = child);
    final childId = child['id'] as String? ?? '';
    if (childId.isNotEmpty) await _loadChildData(childId);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Parent Dashboard')),
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
                      _ChildSelector(
                        children: _children,
                        selected: _selectedChild,
                        onSelect: _selectChild,
                      ),
                      if (_selectedChild != null) ...[
                        const SizedBox(height: 24),
                        _OverviewStats(performance: _performance, child: _selectedChild!),
                        const SizedBox(height: 24),
                        Text('Subject Performance', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 8),
                        _PerformanceChart(performance: _performance),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: _AreaCard(
                                title: 'Strong Areas',
                                color: theme.colorScheme.success,
                                items: _getStrongAreas(),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _AreaCard(
                                title: 'Needs Attention',
                                color: theme.colorScheme.warning,
                                items: _getWeakAreas(),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Text('Recent Courses', style: theme.textTheme.titleMedium),
                        const SizedBox(height: 8),
                        _CourseList(courses: _courses),
                      ] else
                        EduEmptyState(
                          icon: Icons.child_care,
                          title: 'No Children Added',
                          subtitle: 'Add a child to start monitoring their progress',
                        ),
                    ],
                  ),
                ),
    );
  }

  List<String> _getStrongAreas() {
    final subjects = _performance?['strongSubjects'] as List? ?? _performance?['subjects'] as List? ?? [];
    return subjects
        .where((s) => (s is Map ? ((s['score'] as num?)?.toInt() ?? 0) >= 70 : false))
        .map((s) => s is Map ? (s['name'] ?? s['subjectName'])?.toString() ?? '' : '')
        .where((s) => s.isNotEmpty)
        .toList();
  }

  List<String> _getWeakAreas() {
    final subjects = _performance?['weakSubjects'] as List? ?? _performance?['subjects'] as List? ?? [];
    return subjects
        .where((s) => (s is Map ? ((s['score'] as num?)?.toInt() ?? 100) < 70 : false))
        .map((s) => s is Map ? (s['name'] ?? s['subjectName'])?.toString() ?? '' : '')
        .where((s) => s.isNotEmpty)
        .toList();
  }
}

class _ChildSelector extends StatelessWidget {
  final List<Map<String, dynamic>> children;
  final Map<String, dynamic>? selected;
  final VoidCallback onSelect;

  const _ChildSelector({required this.children, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: theme.colorScheme.primary,
            child: Text(
              selected?['firstName']?[0]?.toUpperCase() ?? 'C',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${selected?['firstName'] ?? 'Child'} ${selected?['lastName'] ?? ''}',
                  style: theme.textTheme.titleMedium,
                ),
                Text(
                  '${selected?['className'] ?? selected?['class']} - ${selected?['averageScore'] ?? '?'}% average',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          if (children.length > 1)
            DropdownButton<String>(
              value: selected?['id'],
              items: children.map((c) {
                final name = '${c['firstName'] ?? ''} ${c['lastName'] ?? ''}'.trim();
                return DropdownMenuItem(value: c['id'] as String?, child: Text(name));
              }).toList(),
              onChanged: (value) {
                final child = children.firstWhere((c) => c['id'] == value, orElse: () => {});
                onSelect();
              },
            ),
        ],
      ),
    );
  }
}

class _OverviewStats extends StatelessWidget {
  final Map<String, dynamic>? performance;
  final Map<String, dynamic> child;
  const _OverviewStats({required this.performance, required this.child});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final studyTime = performance?['totalStudyTime'] as String? ?? _formatStudyTime(performance?['studyTimeMinutes'] as num?);
    final courses = (performance?['enrolledCourses'] as num?)?.toInt() ?? (child['courseCount'] as num?)?.toInt() ?? 0;
    final avgScore = (performance?['averageScore'] as num?)?.toInt() ?? 0;
    final lessons = (performance?['completedLessons'] as num?)?.toInt() ?? 0;

    return EduCard(
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(icon: Icons.schedule, value: studyTime, label: 'Study Time'),
          _StatItem(icon: Icons.book, value: '$courses', label: 'Courses'),
          _StatItem(icon: Icons.score, value: '$avgScore%', label: 'Average'),
          _StatItem(icon: Icons.play_arrow, value: '$lessons', label: 'Lessons'),
        ],
      ),
    );
  }

  String _formatStudyTime(num? minutes) {
    if (minutes == null) return '0h';
    final hrs = minutes ~/ 60;
    final mins = minutes % 60;
    return mins > 0 ? '$hrs$h $mins$m' : '$hrs$h';
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
  final Map<String, dynamic>? performance;
  const _PerformanceChart({required this.performance});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final subjects = (performance?['subjects'] as List?) ?? [];

    if (subjects.isEmpty) {
      return EduEmptyState(
        icon: Icons.bar_chart,
        title: 'No Performance Data',
        subtitle: 'Subject performance will appear here once your child takes exams.',
      );
    }

    return EduCard(
      child: Column(
        children: subjects.map((s) {
          final name = s['name'] ?? s['subjectName'] ?? 'Subject';
          final score = (s['score'] as num?)?.toInt() ?? (s['averageScore'] as num?)?.toInt() ?? 0;
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              children: [
                SizedBox(width: 60, child: Text(name, style: theme.textTheme.bodySmall)),
                Expanded(
                  child: EduProgressBar(
                    progress: score / 100,
                    height: 12,
                    color: score >= 70 ? theme.colorScheme.success : theme.colorScheme.warning,
                  ),
                ),
                const SizedBox(width: 8),
                Text('$score%', style: theme.textTheme.labelSmall),
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
          if (items.isEmpty)
            Text('No data yet', style: Theme.of(context).textTheme.bodySmall),
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

class _CourseList extends StatelessWidget {
  final List<Map<String, dynamic>> courses;
  const _CourseList({required this.courses});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (courses.isEmpty) {
      return EduEmptyState(
        icon: Icons.school,
        title: 'No Courses',
        subtitle: 'Your child is not enrolled in any courses yet.',
      );
    }
    return Column(
      children: courses.take(5).map((c) {
        final title = c['title'] as String? ?? 'Course';
        final progress = (c['progressPercentage'] as num?)?.toInt() ?? 0;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.book, color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: theme.textTheme.titleSmall),
                      const SizedBox(height: 4),
                      EduProgressBar(progress: progress / 100, height: 4),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text('$progress%', style: theme.textTheme.labelSmall),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
