import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class CourseDetailPage extends StatelessWidget {
  final String courseId;

  const CourseDetailPage({super.key, required this.courseId});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // App bar with back button
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
              title: const Text('Course Details'),
              titlePadding: const EdgeInsets.only(left: 16, bottom: 16),
              background: Container(
                color: theme.colorScheme.primary,
                child: Center(
                  child: Icon(
                    Icons.school,
                    size: 80,
                    color: Colors.white.withOpacity(0.3),
                  ),
                ),
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.share, color: Colors.white),
                onPressed: () {},
              ),
            ],
          ),

          // Course content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    'SS2 Biology - Cell Structure & Function',
                    style: theme.textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),

                  // Metadata
                  Row(
                    children: [
                      _MetaChip(icon: Icons.person, label: 'Dr. Adeyemi'),
                      const SizedBox(width: 8),
                      _MetaChip(icon: Icons.star, label: '4.8'),
                      const SizedBox(width: 8),
                      _MetaChip(icon: Icons.people, label: '1,250'),
                      const SizedBox(width: 8),
                      _MetaChip(icon: Icons.schedule, label: '6h 30m'),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Free badge
                  EduBadge(
                    label: 'Free',
                    backgroundColor: theme.colorScheme.success,
                    textColor: Colors.white,
                  ),
                  const SizedBox(height: 16),

                  // Enroll button
                  EduButton(
                    label: 'Enroll Now',
                    onPressed: () {},
                  ),
                  const SizedBox(height: 24),

                  // Description
                  Text(
                    'Course Description',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Learn about the structure and function of cells, the basic unit of life. This comprehensive course covers cell organelles, cell division, membrane transport, and more.',
                    style: theme.textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 24),

                  // What you'll learn
                  Text(
                    'What You\'ll Learn',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  _LearningItem(text: 'Cell structure and organelles'),
                  _LearningItem(text: 'Cell division (Mitosis & Meiosis)'),
                  _LearningItem(text: 'Cell membrane transport'),
                  _LearningItem(text: 'Cell energy production'),
                  const SizedBox(height: 24),

                  // Curriculum
                  Text(
                    'Curriculum',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  _CurriculumSection(
                    title: 'Module 1: Introduction to Cells',
                    lessons: 3,
                    isExpanded: true,
                  ),
                  _CurriculumSection(
                    title: 'Module 2: Cell Organelles',
                    lessons: 4,
                    isExpanded: false,
                  ),
                  _CurriculumSection(
                    title: 'Module 3: Cell Division',
                    lessons: 5,
                    isExpanded: false,
                  ),
                  _CurriculumSection(
                    title: 'Module 4: Cell Membrane',
                    lessons: 3,
                    isExpanded: false,
                  ),
                  const SizedBox(height: 24),

                  // Reviews
                  Text(
                    'Reviews',
                    style: theme.textTheme.titleMedium,
                  ),
                  const SizedBox(height: 8),
                  _ReviewItem(
                    author: 'Adebayo O.',
                    rating: 5,
                    date: '2 weeks ago',
                    comment: 'Excellent course! Very well explained.',
                  ),
                  _ReviewItem(
                    author: 'Fatima M.',
                    rating: 4,
                    date: '1 month ago',
                    comment: 'Good content, could use more practice questions.',
                  ),
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

class _LearningItem extends StatelessWidget {
  final String text;

  const _LearningItem({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        children: [
          Icon(Icons.check_circle, size: 16, color: Theme.of(context).colorScheme.success),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: Theme.of(context).textTheme.bodyMedium)),
        ],
      ),
    );
  }
}

class _CurriculumSection extends StatefulWidget {
  final String title;
  final int lessons;
  final bool isExpanded;

  const _CurriculumSection({
    required this.title,
    required this.lessons,
    required this.isExpanded,
  });

  @override
  State<_CurriculumSection> createState() => _CurriculumSectionState();
}

class _CurriculumSectionState extends State<_CurriculumSection> {
  late bool _isExpanded;

  @override
  void initState() {
    super.initState();
    _isExpanded = widget.isExpanded;
  }

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
            subtitle: Text('${widget.lessons} lessons', style: theme.textTheme.labelSmall),
            trailing: IconButton(
              icon: Icon(
                _isExpanded ? Icons.expand_less : Icons.expand_more,
              ),
              onPressed: () => setState(() => _isExpanded = !_isExpanded),
            ),
          ),
          if (_isExpanded) ...[
            const Divider(height: 1),
            ...List.generate(
              widget.lessons,
              (i) => ListTile(
                leading: const Icon(Icons.play_circle_outline, size: 20),
                title: Text('Lesson ${i + 1}'),
                subtitle: const Text('15 min'),
                trailing: const Icon(Icons.lock, size: 16),
                contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 4),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ReviewItem extends StatelessWidget {
  final String author;
  final int rating;
  final String date;
  final String comment;

  const _ReviewItem({
    required this.author,
    required this.rating,
    required this.date,
    required this.comment,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      margin: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: theme.colorScheme.primary,
                child: Text(
                  author[0],
                  style: theme.textTheme.labelLarge?.copyWith(color: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(author, style: theme.textTheme.titleSmall),
                    Row(
                      children: List.generate(
                        5,
                        (i) => Icon(
                          Icons.star,
                          size: 14,
                          color: i < rating ? Colors.amber : Colors.grey,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Text(date, style: theme.textTheme.labelSmall),
            ],
          ),
          const SizedBox(height: 8),
          Text(comment, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}
