import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class QuestionsPage extends StatelessWidget {
  const QuestionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Past Questions')),
      body: Column(
        children: [
          // Board selector
          Padding(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 8,
              children: ['JAMB', 'WAEC', 'NECO', 'NABTEB'].map((board) {
                return EduChip(
                  label: board,
                  isSelected: board == 'JAMB',
                  onTap: () {},
                );
              }).toList(),
            ),
          ),

          // Subject list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: 8,
              itemBuilder: (context, index) {
                return _SubjectCard(
                  name: _getSubjectName(index),
                  questions: _getQuestionCount(index),
                  onPress: () => context.push('/past-questions/JAMB/$_getSubjectName(index)'),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  String _getSubjectName(int index) => ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Commerce'][index];
  int _getQuestionCount(int index) => [450, 380, 320, 290, 275, 200, 180, 150][index];
}

class _SubjectCard extends StatelessWidget {
  final String name;
  final int questions;
  final VoidCallback onPress;

  const _SubjectCard({required this.name, required this.questions, required this.onPress});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: EduCard(
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
      ),
    );
  }
}
