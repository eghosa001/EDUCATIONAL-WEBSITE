import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';

class ExamsPage extends ConsumerStatefulWidget {
  const ExamsPage({super.key});

  @override
  ConsumerState<ExamsPage> createState() => _ExamsPageState();
}

class _ExamsPageState extends ConsumerState<ExamsPage> {
  String? _filter;
  List<Map<String, dynamic>> _exams = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadExams();
  }

  Future<void> _loadExams([String? filter]) async {
    setState(() {
      _isLoading = true;
      _error = null;
      _filter = filter;
    });
    try {
      final repo = ref.read(examRepositoryProvider);
      final exams = await repo.getExams(limit: 50);
      List<Map<String, dynamic>> filtered = exams;
      if (filter == 'upcoming') {
        filtered = exams.where((e) {
          final status = e['status'] as String?;
          return status == 'scheduled' || status == 'published';
        }).toList();
      } else if (filter == 'completed') {
        filtered = exams.where((e) {
          final status = e['status'] as String?;
          return status == 'completed';
        }).toList();
      }
      if (mounted) {
        setState(() {
          _exams = filtered;
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
      appBar: AppBar(
        title: const Text('Exams'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'all', child: Text('All')),
              const PopupMenuItem(value: 'upcoming', child: Text('Upcoming')),
              const PopupMenuItem(value: 'completed', child: Text('Completed')),
            ],
            onSelected: _loadExams,
          ),
        ],
      ),
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
                      ElevatedButton(onPressed: _loadExams, child: const Text('Retry')),
                    ],
                  ),
                )
              : _exams.isEmpty
                  ? EduEmptyState(
                      icon: Icons.assignment,
                      title: 'No Exams Available',
                      subtitle: 'Check back later for new exams',
                    )
                  : RefreshIndicator(
                      onRefresh: () => _loadExams(_filter),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _exams.length,
                        itemBuilder: (context, index) {
                          final exam = _exams[index];
                          return _ExamCard(exam: exam);
                        },
                      ),
                    ),
    );
  }
}

class _ExamCard extends StatelessWidget {
  final Map<String, dynamic> exam;
  const _ExamCard({required this.exam});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final title = exam['title'] as String? ?? 'Untitled Exam';
    final subject = exam['subjectName'] ?? exam['subject'] ?? 'Subject';
    final duration = exam['durationMinutes'] != null
        ? '${exam['durationMinutes']} min'
        : exam['duration'] as String? ?? '60 min';
    final questionCount = (exam['questionCount'] as num?)?.toInt() ?? 20;
    final status = exam['status'] as String? ?? 'scheduled';
    final date = exam['scheduledAt'] ?? exam['date'] ?? '';
    final totalMarks = (exam['totalMarks'] as num?)?.toInt() ?? 100;

    Color statusColor;
    String statusLabel;
    switch (status) {
      case 'completed':
        statusColor = theme.colorScheme.success;
        statusLabel = 'Completed';
        break;
      case 'active':
      case 'published':
        statusColor = theme.colorScheme.warning;
        statusLabel = 'Available';
        break;
      case 'draft':
        statusColor = theme.colorScheme.onSurfaceVariant;
        statusLabel = 'Draft';
        break;
      default:
        statusColor = theme.colorScheme.primary;
        statusLabel = status.toUpperCase();
    }

    final score = exam['score'] as num?;

    return EduCard(
      margin: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  statusLabel,
                  style: theme.textTheme.labelSmall?.copyWith(color: statusColor, fontWeight: FontWeight.bold),
                ),
              ),
              const Spacer(),
              if (date.isNotEmpty)
                Text(
                  _formatDate(date),
                  style: theme.textTheme.labelSmall,
                ),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: theme.textTheme.titleLarge),
          const SizedBox(height: 4),
          Text(subject, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
          if (score != null) ...[
            const SizedBox(height: 8),
            EduBadge(
              label: 'Score: ${score.toInt()}%',
              backgroundColor: theme.colorScheme.success.withOpacity(0.15),
              textColor: theme.colorScheme.success,
            ),
          ],
          const SizedBox(height: 12),
          Row(
            children: [
              _ExamMeta(icon: Icons.timer, label: duration),
              const SizedBox(width: 16),
              _ExamMeta(icon: Icons.question_answer, label: '$questionCount Questions'),
              const SizedBox(width: 16),
              _ExamMeta(icon: Icons.star, label: '$totalMarks Marks'),
            ],
          ),
          const SizedBox(height: 12),
          EduButton(
            label: status == 'completed' ? 'View Results' : (status == 'active' || status == 'published') ? 'Start Exam' : 'Coming Soon',
            onPressed: (status == 'completed' || status == 'active' || status == 'published')
                ? () => context.push('/exams/${exam['id']}')
                : null,
            isOutlined: status == 'completed',
            textColor: theme.colorScheme.primary,
            isDisabled: status == 'draft',
          ),
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.tryParse(dateStr);
      if (dt == null) return dateStr;
      return '${dt.day} ${_monthName(dt.month)} ${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }

  String _monthName(int month) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months[month - 1] ?? '';
  }
}

class _ExamMeta extends StatelessWidget {
  final IconData icon;
  final String label;
  const _ExamMeta({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 16, color: theme.colorScheme.onSurfaceVariant),
        const SizedBox(width: 4),
        Text(label, style: theme.textTheme.labelSmall),
      ],
    );
  }
}
