import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';

class CommunityPage extends ConsumerStatefulWidget {
  const CommunityPage({super.key});

  @override
  ConsumerState<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends ConsumerState<CommunityPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _posts = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadPosts();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadPosts() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      // Use course repository as a proxy for community data
      final repo = ref.read(courseRepositoryProvider);
      // In a real app, there would be a community repository
      // For now, load some sample data
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) {
        setState(() {
          _posts = [
            {'type': 'forum', 'title': 'Cell Biology Discussion', 'author': 'Adebayo', 'replies': 23, 'views': 156, 'time': '2h ago', 'tags': ['Biology', 'Cell']},
            {'type': 'forum', 'title': 'Math Problems Help', 'author': 'Fatima', 'replies': 15, 'views': 89, 'time': '5h ago', 'tags': ['Math', 'Algebra']},
            {'type': 'qa', 'question': 'How do you balance chemical equations?', 'author': 'Chidi', 'answers': 5, 'votes': 12, 'time': '1h ago'},
            {'type': 'qa', 'question': 'What is the difference between mitosis and meiosis?', 'author': 'Bola', 'answers': 3, 'votes': 8, 'time': '3h ago'},
          ];
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
        title: const Text('Community'),
        actions: [
          IconButton(icon: const Icon(Icons.filter_list), onPressed: () {}),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: theme.colorScheme.primary,
          labelColor: theme.colorScheme.primary,
          unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
          tabs: const [Tab(text: 'Forums'), Tab(text: 'Study Groups'), Tab(text: 'Q&A')],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.error_outline, size: 48, color: theme.colorScheme.error), const SizedBox(height: 16), Text(_error!), const SizedBox(height: 16), ElevatedButton(onPressed: _loadPosts, child: const Text('Retry'))]))
              : TabBarView(
                  controller: _tabController,
                  children: [_ForumsTab(posts: _posts), _StudyGroupsTab(), _QnATab(posts: _posts)],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Create post feature coming soon'))),
        backgroundColor: theme.colorScheme.primary,
        icon: const Icon(Icons.add),
        label: const Text('Post'),
      ),
    );
  }
}

class _ForumsTab extends StatelessWidget {
  final List<Map<String, dynamic>> posts;
  const _ForumsTab({required this.posts});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final forums = posts.where((p) => p['type'] == 'forum').toList();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: forums.length,
      itemBuilder: (context, index) {
        final post = forums[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: EduCard(
            onTap: () {},
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(backgroundColor: theme.colorScheme.primary, child: Text(post['author'][0], style: theme.textTheme.labelLarge?.copyWith(color: Colors.white))),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(post['title'] as String?, style: theme.textTheme.titleSmall),
                          Text('${post['author']} · ${post['time']}', style: theme.textTheme.labelSmall),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  children: (post['tags'] as List?)?.map((tag) => EduBadge(label: tag as String, backgroundColor: theme.colorScheme.primaryContainer)).toList() ?? [],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.reply, size: 16, color: theme.colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text('${post['replies']} replies', style: theme.textTheme.labelSmall),
                    const SizedBox(width: 16),
                    Icon(Icons.visibility, size: 16, color: theme.colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text('${post['views']} views', style: theme.textTheme.labelSmall),
                  ],
                ),
              ],
            ),
          ),
        );
      },
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
        onAction: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Create group feature coming soon'))),
      ),
    );
  }
}

class _QnATab extends StatelessWidget {
  final List<Map<String, dynamic>> posts;
  const _QnATab({required this.posts});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final qas = posts.where((p) => p['type'] == 'qa').toList();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: qas.length,
      itemBuilder: (context, index) {
        final qa = qas[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: EduCard(
            onTap: () {},
            child: Row(
              children: [
                Column(
                  children: [
                    Text('${qa['votes']}', style: theme.textTheme.titleMedium),
                    Text('votes', style: theme.textTheme.labelSmall),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(qa['question'] as String?, style: theme.textTheme.titleSmall),
                      const SizedBox(height: 4),
                      Text('${qa['answers']} answers · ${qa['author']} · ${qa['time']}', style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
