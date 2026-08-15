import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';
import '../../shared/providers/index.dart';

class CoursesPage extends ConsumerWidget {
  const CoursesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Courses'),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/search'),
          ),
        ],
      ),
      body: const _CoursesBody(),
    );
  }
}

class _CoursesBody extends ConsumerStatefulWidget {
  const _CoursesBody();

  @override
  ConsumerState<_CoursesBody> createState() => _CoursesBodyState();
}

class _CoursesBodyState extends ConsumerState<_CoursesBody> {
  String _selectedCategory = 'all';
  String _selectedLevel = 'all';
  bool _isLoading = true;

  final List<String> _categories = ['all', 'Science', 'Mathematics', 'English', 'Arts', 'Commercial'];
  final List<String> _levels = ['all', 'Primary', 'JSS', 'SS', 'Tertiary'];

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(courseRepositoryProvider);
      await repo.getCourses(category: _selectedCategory == 'all' ? null : _selectedCategory);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load courses: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Search courses...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
              ),
              onChanged: (value) {
                // Implement search
              },
            ),
          ),

          // Category chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _categories.map((category) {
                  final isSelected = _selectedCategory == category;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: EduChip(
                      label: category == 'all' ? 'All' : category,
                      isSelected: isSelected,
                      onTap: () {
                        setState(() => _selectedCategory = category);
                        _loadCourses();
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Level filter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Wrap(
              spacing: 8,
              children: _levels.map((level) {
                final isSelected = _selectedLevel == level;
                return EduChip(
                  label: level == 'all' ? 'All Levels' : level,
                  isSelected: isSelected,
                  onTap: () {
                    setState(() => _selectedLevel = level);
                    _loadCourses();
                  },
                );
              }).toList(),
            ),
          ),

          const SizedBox(height: 16),

          // Course list
          _CourseList(),
        ],
      ),
    );
  }
}

class _CourseList extends ConsumerWidget {
  const _CourseList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: 6,
      itemBuilder: (context, index) {
        return _CourseCard(
          title: 'SS2 Biology - Cell Structure',
          description: 'Learn about cell structure and function',
          instructor: 'Dr. Adeyemi',
          rating: 4.8,
          students: 1250,
          lessons: 12,
          duration: '6h 30m',
          price: 0,
          isFree: true,
          thumbnail: null,
          onPress: () => context.push('/courses/1'),
        );
      },
    );
  }
}

class _CourseCard extends StatelessWidget {
  final String title;
  final String description;
  final String instructor;
  final double rating;
  final int students;
  final int lessons;
  final String duration;
  final double price;
  final bool isFree;
  final String? thumbnail;
  final VoidCallback onPress;

  const _CourseCard({
    required this.title,
    required this.description,
    required this.instructor,
    required this.rating,
    required this.students,
    required this.lessons,
    required this.duration,
    required this.price,
    required this.isFree,
    this.thumbnail,
    required this.onPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onPress,
      child: EduCard(
        margin: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            // Thumbnail
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.school, size: 40, color: Colors.white),
            ),
            const SizedBox(width: 12),
            // Course info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.titleSmall,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: theme.textTheme.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Icon(Icons.person, size: 14, color: theme.colorScheme.onSurfaceVariant),
                      const SizedBox(width: 4),
                      Text(
                        instructor,
                        style: theme.textTheme.labelSmall,
                      ),
                      const Spacer(),
                      Row(
                        children: [
                          const Icon(Icons.star, size: 14, color: Colors.amber),
                          const SizedBox(width: 2),
                          Text(
                            rating.toStringAsFixed(1),
                            style: theme.textTheme.labelSmall,
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text('$lessons lessons', style: theme.textTheme.labelSmall),
                      const SizedBox(width: 8),
                      Text(duration, style: theme.textTheme.labelSmall),
                      const Spacer(),
                      if (isFree)
                        EduBadge(
                          label: 'Free',
                          backgroundColor: theme.colorScheme.success,
                          textColor: Colors.white,
                        )
                      else
                        Text(
                          '₦${price.toStringAsFixed(0)}',
                          style: theme.textTheme.labelLarge?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
