import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';

class QuestionsPage extends ConsumerStatefulWidget {
  const QuestionsPage({super.key});

  @override
  ConsumerState<QuestionsPage> createState() => _QuestionsPageState();
}

class _QuestionsPageState extends ConsumerState<QuestionsPage> {
  String? _selectedBoard;
  List<dynamic> _subjects = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadBoards();
  }

  Future<void> _loadBoards() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final repo = ref.read(questionRepositoryProvider);
      final boards = await repo.getBoards();
      if (mounted) {
        setState(() {
          _subjects = [];
          _isLoading = false;
          // Default to first board if available
          if (boards.isNotEmpty) {
            _selectedBoard = boards[0]['name'] ?? boards[0]['id'];
            _loadSubjects(_selectedBoard!);
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load boards: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadSubjects(String board) async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(questionRepositoryProvider);
      final subjects = await repo.getTopicsByBoard(board);
      if (mounted) {
        setState(() {
          _subjects = subjects;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load subjects: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Past Questions')),
      body: _isLoading && _subjects.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Board selector
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: _isLoading && _selectedBoard == null
                      ? const Center(child: CircularProgressIndicator())
                      : Wrap(
                          spacing: 8,
                          children: ['JAMB', 'WAEC', 'NECO', 'NABTEB'].map((board) {
                            return EduChip(
                              label: board,
                              isSelected: board == _selectedBoard,
                              onTap: () {
                                setState(() => _selectedBoard = board);
                                _loadSubjects(board);
                              },
                            );
                          }).toList(),
                        ),
                ),
                // Subject list
                Expanded(
                  child: _error != null
                      ? Center(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error),
                              const SizedBox(height: 16),
                              Text(_error!, style: theme.textTheme.bodyMedium),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _loadBoards,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        )
                      : _subjects.isEmpty
                          ? EduEmptyState(
                              icon: Icons.search_off,
                              title: 'No Subjects Found',
                              subtitle: 'No subjects available for $_selectedBoard yet.',
                            )
                          : ListView.builder(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: _subjects.length,
                              itemBuilder: (context, index) {
                                final subject = _subjects[index];
                                final name = subject['name'] ?? subject['title'] ?? subject['subjectName'] ?? 'Unknown';
                                final questionCount = subject['questionCount'] ?? subject['count'] ?? 0;
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: _SubjectCard(
                                    name: name,
                                    questions: questionCount is int ? questionCount : int.tryParse(questionCount.toString()) ?? 0,
                                    onPress: () => context.push('/past-questions/$_selectedBoard/$name'),
                                  ),
                                );
                              },
                            ),
                ),
              ],
            ),
    );
  }
}

class _SubjectCard extends StatelessWidget {
  final String name;
  final int questions;
  final VoidCallback onPress;

  const _SubjectCard({required this.name, required this.questions, required this.onPress});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      onTap: onPress,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(Icons.question_answer, color: theme.colorScheme.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: theme.textTheme.titleSmall),
                Text('$questions questions available', style: theme.textTheme.labelSmall),
              ],
            ),
          ),
          const Icon(Icons.chevron_right),
        ],
      ),
    );
  }
}
