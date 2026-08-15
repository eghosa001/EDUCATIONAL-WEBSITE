import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class CommunityPage extends StatelessWidget {
  const CommunityPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Community'),
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: () {}),
        ],
      ),
      body: DefaultTabController(
        length: 3,
        child: Column(
          children: [
            TabBar(
              tabs: const [
                Tab(text: 'Forums'),
                Tab(text: 'Study Groups'),
                Tab(text: 'Q&A'),
              ],
            ),
            Expanded(
              child: TabBarView(
                children: [
                  _ForumsTab(),
                  _StudyGroupsTab(),
                  _QnATab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ForumsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return _ForumPost(
          title: _getForumTitle(index),
          author: _getForumAuthor(index),
          replies: _getForumReplies(index),
          views: _getForumViews(index),
          time: _getForumTime(index),
          tags: _getForumTags(index),
          onPress: () {},
        );
      },
    );
  }

  String _getForumTitle(int index) => ['Cell Biology Discussion', 'Math Problems Help', 'Physics Lab Report', 'Chemistry Equations', 'English Essay Writing'][index];
  String _getForumAuthor(int index) => ['Adebayo', 'Fatima', 'Chinedu', 'Amina', 'Tunde'][index];
  int _getForumReplies(int index) => [23, 15, 8, 31, 12][index];
  int _getForumViews(int index) => [156, 89, 45, 234, 67][index];
  String _getForumTime(int index) => ['2 hours ago', '5 hours ago', '1 day ago', '3 days ago', '1 week ago'][index];
  List<String> _getForumTags(int index) => [['Biology', 'Cell'], ['Math', 'Algebra'], ['Physics'], ['Chemistry'], ['English', 'Writing']][index];
}

class _ForumPost extends StatelessWidget {
  final String title;
  final String author;
  final int replies;
  final int views;
  final String time;
  final List<String> tags;
  final VoidCallback onPress;

  const _ForumPost({
    required this.title,
    required this.author,
    required this.replies,
    required this.views,
    required this.time,
    required this.tags,
    required this.onPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: EduCard(
        onTap: onPress,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: theme.colorScheme.primary,
                  child: Text(author[0], style: theme.textTheme.labelLarge?.copyWith(color: Colors.white)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: theme.textTheme.titleSmall),
                      Text('$author · $time', style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 4,
              children: tags.map((tag) => EduBadge(label: tag, backgroundColor: theme.colorScheme.primaryContainer)).toList(),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.reply, size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text('$replies replies', style: theme.textTheme.labelSmall),
                const SizedBox(width: 16),
                Icon(Icons.visibility, size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text('$views views', style: theme.textTheme.labelSmall),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StudyGroupsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: EduEmptyState(
        icon: Icons.groups,
        title: 'No Study Groups',
        subtitle: 'Join or create a study group to learn with others',
        actionLabel: 'Create Group',
        onAction: () {},
      ),
    );
  }
}

class _QnATab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 5,
      itemBuilder: (context, index) {
        return _QAItem(
          question: _getQuestion(index),
          author: _getQAAuthor(index),
          answers: _getQAAnswers(index),
          votes: _getQAVotes(index),
          time: _getQATime(index),
          onPress: () {},
        );
      },
    );
  }

  String _getQuestion(int index) => [
    'How do you balance chemical equations?',
    'What is the difference between mitosis and meiosis?',
    'Can someone explain Ohm\'s law?',
    'How to write a good essay introduction?',
    'Help with quadratic equations',
  ][index];
  String _getQAAuthor(int index) => ['Chidi', 'Bola', 'Aisha', 'Emeka', 'Funke'][index];
  int _getQAAnswers(int index) => [5, 3, 8, 2, 4][index];
  int _getQAVotes(int index) => [12, 8, 23, 5, 15][index];
  String _getQATime(int index) => ['1 hour ago', '3 hours ago', 'Yesterday', '2 days ago', '5 days ago'][index];
}

class _QAItem extends StatelessWidget {
  final String question;
  final String author;
  final int answers;
  final int votes;
  final String time;
  final VoidCallback onPress;

  const _QAItem({
    required this.question,
    required this.author,
    required this.answers,
    required this.votes,
    required this.time,
    required this.onPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: EduCard(
        onTap: onPress,
        child: Row(
          children: [
            Column(
              children: [
                Text('$votes', style: theme.textTheme.titleMedium),
                Text('votes', style: theme.textTheme.labelSmall),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(question, style: theme.textTheme.titleSmall),
                  const SizedBox(height: 4),
                  Text('$answers answers · $author · $time', style: theme.textTheme.labelSmall),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
