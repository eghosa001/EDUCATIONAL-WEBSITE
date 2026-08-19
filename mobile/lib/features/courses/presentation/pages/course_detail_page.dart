import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../di/index.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/index.dart';

class CourseDetailPage extends ConsumerStatefulWidget {
  final String courseId;

  const CourseDetailPage({super.key, required this.courseId});

  @override
  ConsumerState<CourseDetailPage> createState() => _CourseDetailPageState();
}

class _CourseDetailPageState extends ConsumerState<CourseDetailPage> {
  Map<String, dynamic>? _course;
  List<dynamic> _sections = [];
  bool _isLoading = true;
  bool _isEnrolling = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCourse();
  }

  Future<void> _loadCourse() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final repo = ref.read(courseRepositoryProvider);
      final response = await ref.read(apiClientProvider).dio.get(
        '/courses/${widget.courseId}',
      );
      final courseData = response.data['data'] as Map<String, dynamic>? ?? {};
      final courseJson = courseData['course'] as Map<String, dynamic>? ?? courseData;
      if (mounted) {
        setState(() {
          _course = courseJson;
          _sections = (courseJson['sections'] as List?) ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() { _error = e.toString(); _isLoading = false; });
      }
    }
  }

  Future<void> _enroll() async {
    setState(() => _isEnrolling = true);
    try {
      await ref.read(courseRepositoryProvider).enrollCourse(widget.courseId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Enrolled successfully!')),
        );
        _loadCourse();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Enrollment failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isEnrolling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Course Details')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              EduButton(label: 'Retry', onPressed: _loadCourse),
            ],
          ),
        ),
      );
    }

    final course = _course ?? {};
    final title = course['title'] as String? ?? 'Course';
    final description = course['fullDescription'] as String? ?? course['shortDescription'] as String? ?? '';
    final rating = (course['rating'] as num?)?.toDouble() ?? 0.0;
    final enrollmentCount = (course['enrollmentCount'] as num?)?.toInt() ?? 0;
    final totalDurationHours = (course['totalDurationHours'] as num?)?.toDouble() ?? 0.0;
    final lessonCount = (course['lessonCount'] as num?)?.toInt() ?? 0;
    final isFree = course['isFree'] as bool? ?? true;
    final price = (course['price'] as num?)?.toDouble() ?? 0.0;
    final difficulty = course['difficulty'] as String? ?? '';
    final teacherId = course['teacherId'] as String? ?? '';

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            floating: false,
            pinned: true,
            backgroundColor: theme.colorScheme.primary,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              onPressed: () => context.pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              title: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis),
              titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
              background: Container(
                color: theme.colorScheme.primary,
                child: Center(
                  child: Icon(Icons.school, size: 80, color: Colors.white.withOpacity(0.3)),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: theme.textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 4,
                    children: [
                      if (difficulty.isNotEmpty)
                        _MetaChip(icon: Icons.signal_cellular_alt, label: difficulty),
                      if (rating > 0) _MetaChip(icon: Icons.star, label: rating.toStringAsFixed(1)),
                      if (enrollmentCount > 0) _MetaChip(icon: Icons.people, label: '$enrollmentCount'),
                      if (totalDurationHours > 0) _MetaChip(icon: Icons.schedule, label: '${totalDurationHours.toStringAsFixed(1)}h'),
                      if (lessonCount > 0) _MetaChip(icon: Icons.play_circle, label: '$lessonCount lessons'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (isFree)
                    EduBadge(label: 'Free', backgroundColor: theme.colorScheme.tertiary, textColor: Colors.white)
                  else
                    EduBadge(label: '₦${price.toStringAsFixed(0)}', backgroundColor: theme.colorScheme.primary, textColor: Colors.white),
                  const SizedBox(height: 16),
                  EduButton(
                    label: _isEnrolling ? 'Enrolling...' : 'Enroll Now',
                    isLoading: _isEnrolling,
                    onPressed: isFree ? _enroll : null,
                  ),
                  const SizedBox(height: 24),
                  if (description.isNotEmpty) ...[
                    Text('Description', style: theme.textTheme.titleMedium),
                    const SizedBox(height: 8),
                    Text(description, style: theme.textTheme.bodyMedium),
                    const SizedBox(height: 24),
                  ],
                  Text('Curriculum', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  if (_sections.isEmpty)
                    EduEmptyState(
                      icon: Icons.menu_book,
                      title: 'No sections available',
                      subtitle: 'Course content is being prepared',
                    )
                  else
                    ..._sections.map((section) => _CurriculumSection(
                      title: section['title'] as String? ?? 'Section',
                      lessons: (section['lessons'] as List?) ?? [],
                    )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MetaChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _MetaChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14),
        const SizedBox(width: 4),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _CurriculumSection extends StatefulWidget {
  final String title;
  final List<dynamic> lessons;
  const _CurriculumSection({required this.title, required this.lessons});

  @override
  State<_CurriculumSection> createState() => _CurriculumSectionState();
}

class _CurriculumSectionState extends State<_CurriculumSection> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ListTile(
            title: Text(widget.title, style: theme.textTheme.titleSmall),
            subtitle: Text('${widget.lessons.length} lessons', style: theme.textTheme.labelSmall),
            trailing: IconButton(
              icon: Icon(_isExpanded ? Icons.expand_less : Icons.expand_more),
              onPressed: () => setState(() => _isExpanded = !_isExpanded),
            ),
          ),
          if (_isExpanded && widget.lessons.isNotEmpty) ...[
            const Divider(height: 1),
            ...widget.lessons.map((lesson) => ListTile(
              leading: const Icon(Icons.play_circle_outline, size: 20),
              title: Text(lesson['title'] as String? ?? 'Lesson'),
              subtitle: Text('${(lesson['durationMinutes'] as num?) ?? 0} min'),
              contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
            )),
          ],
        ],
      ),
    );
  }
}
