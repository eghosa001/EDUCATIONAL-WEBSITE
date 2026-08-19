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
  List<Map<String, dynamic>> _forumPosts = [];
  List<Map<String, dynamic>> _studyGroups = [];
  List<Map<String, dynamic>> _qaPosts = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final repo = ref.read(communityRepositoryProvider);
      await Future.wait([
        repo.getPosts().then((posts) {
          if (mounted) {
            setState(() {
              _forumPosts = posts.where((p) => (p['type'] as String?) != 'qa').toList();
              _qaPosts = posts.where((p) => (p['type'] as String?) == 'qa' || (p['question'] != null)).toList();
            });
          }
        }),
        repo.getStudyGroups().then((groups) {
          if (mounted) {
            setState(() => _studyGroups = groups);
          }
        }),
      ]);
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
              : TabBarView(
                  controller: _tabController,
                  children: [
                    _ForumsTab(posts: _forumPosts),
                    _StudyGroupsTab(groups: _studyGroups),
                    _QnATab(posts: _qaPosts),
                  ],
                ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/community/new-post'),
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
    if (posts.isEmpty) {
      return const EduEmptyState(
        icon: Icons.forum,
        title: 'No Forum Posts',
        subtitle: 'Be the first to start a discussion!',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: posts.length,
      itemBuilder: (context, index) {
        final post = posts[index];
        final title = post['title'] as String? ?? 'Untitled Post';
        final author = post['authorName'] ?? post['author'] ?? 'Anonymous';
        final replyCount = (post['replyCount'] as num?)?.toInt() ?? (post['replies'] as num?)?.toInt() ?? 0;
        final viewCount = (post['viewCount'] as num?)?.toInt() ?? 0;
        final timeAgo = post['relativeTime'] ?? _formatRelativeTime(post['createdAt'] as String? ?? post['created_at'] as String?);
        final tags = (post['tags'] as List?)?.map((t) => t as String).toList() ?? [];
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: EduCard(
            onTap: () => context.push('/community/posts/${post['id']}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: theme.colorScheme.primary,
                      child: Text(
                        author.isNotEmpty ? author[0].toUpperCase() : '?',
                        style: theme.textTheme.labelLarge?.copyWith(color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: theme.textTheme.titleSmall),
                          Text('$author · $timeAgo', style: theme.textTheme.labelSmall),
                        ],
                      ),
                    ),
                  ],
                ),
                if (tags.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 4,
                    children: tags.map((tag) => EduBadge(label: tag, backgroundColor: theme.colorScheme.primaryContainer)).toList(),
                  ),
                ],
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.reply, size: 16, color: theme.colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text('$replyCount replies', style: theme.textTheme.labelSmall),
                    const SizedBox(width: 16),
                    Icon(Icons.visibility, size: 16, color: theme.colorScheme.onSurfaceVariant),
                    const SizedBox(width: 4),
                    Text('$viewCount views', style: theme.textTheme.labelSmall),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _formatRelativeTime(String? isoStr) {
    if (isoStr == null) return 'Just now';
    try {
      final dt = DateTime.tryParse(isoStr);
      if (dt == null) return 'Just now';
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${(diff.inDays / 7).floor()}w ago';
    } catch (_) {
      return 'Just now';
    }
  }
}

class _StudyGroupsTab extends StatelessWidget {
  final List<Map<String, dynamic>> groups;
  const _StudyGroupsTab({required this.groups});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (groups.isEmpty) {
      return const EduEmptyState(
        icon: Icons.groups,
        title: 'No Study Groups',
        subtitle: 'Join or create a study group to learn with others',
        actionLabel: 'Create Group',
        onAction: () {},
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: groups.length,
      itemBuilder: (context, index) {
        final group = groups[index];
        final name = group['name'] as String? ?? 'Study Group';
        final members = (group['memberCount'] as num?)?.toInt() ?? (group['members'] as num?)?.toInt() ?? 0;
        final description = group['description'] as String? ?? '';
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: EduCard(
            onTap: () => context.push('/community/groups/${group['id']}'),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 48, height: 48,
                      decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(8)),
                      child: const Icon(Icons.groups, color: Colors.blue),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(name, style: theme.textTheme.titleSmall),
                          Text('$members members', style: theme.textTheme.labelSmall),
                        ],
                      ),
                    ),
                  ],
                ),
                if (description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(description, style: theme.textTheme.bodySmall),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _QnATab extends StatelessWidget {
  final List<Map<String, dynamic>> posts;
  const _QnATab({required this.posts});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (posts.isEmpty) {
      return const EduEmptyState(
        icon: Icons.help_outline,
        title: 'No Questions Yet',
        subtitle: 'Ask a question to the community!',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: posts.length,
      itemBuilder: (context, index) {
        final qa = posts[index];
        final question = qa['question'] as String? ?? qa['title'] as String? ?? 'Untitled Question';
        final votes = (qa['voteCount'] as num?)?.toInt() ?? (qa['votes'] as num?)?.toInt() ?? 0;
        final answers = (qa['answerCount'] as num?)?.toInt() ?? (qa['answers'] as num?)?.toInt() ?? 0;
        final author = qa['authorName'] ?? qa['author'] ?? 'Anonymous';
        final timeAgo = qa['relativeTime'] ?? _formatRelativeTime(qa['createdAt'] as String? ?? qa['created_at'] as String?);
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: EduCard(
            onTap: () => context.push('/community/qa/${qa['id']}'),
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
                      Text('$answers answers · ${qa['author'] ?? author} · $timeAgo', style: theme.textTheme.labelSmall),
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

  String _formatRelativeTime(String? isoStr) {
    if (isoStr == null) return 'Just now';
    try {
      final dt = DateTime.tryParse(isoStr);
      if (dt == null) return 'Just now';
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return '${(diff.inDays / 7).floor()}w ago';
    } catch (_) {
      return 'Just now';
    }
  }
}
