import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../shared/widgets/index.dart';
import '../../../../shared/repositories/index.dart';
import '../../../../shared/models/live_class/live_class_model.dart';
import '../../../../core/constants/app_colors.dart';

enum LiveClassTab { upcoming, live, recorded }

class LiveClassesPage extends ConsumerStatefulWidget {
  const LiveClassesPage({super.key});

  @override
  ConsumerState<LiveClassesPage> createState() => _LiveClassesPageState();
}

class _LiveClassesPageState extends ConsumerState<LiveClassesPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  LiveClassTab _currentTab = LiveClassTab.upcoming;
  bool _isLoading = false;
  List<LiveClass> _classes = [];
  int _page = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadClasses();
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    setState(() => _currentTab = _tabToEnum(_tabController.index));
    _page = 1;
    _hasMore = true;
    _loadClasses();
  }

  LiveClassTab _tabToEnum(int index) {
    return [LiveClassTab.upcoming, LiveClassTab.live, LiveClassTab.recorded][index];
  }

  Future<void> _loadClasses() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(liveClassRepositoryProvider);
      final status = _statusForTab(_currentTab);
      final response = await repo.getClasses(
        page: _page,
        limit: 10,
        status: status,
      );
      if (mounted) {
        setState(() {
          if (_page == 1) {
            _classes = response.data;
          } else {
            _classes.addAll(response.data);
          }
          _hasMore = response.data.length >= 10;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load classes: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String? _statusForTab(LiveClassTab tab) {
    switch (tab) {
      case LiveClassTab.live:
        return LiveClassStatus.live;
      case LiveClassTab.recorded:
        return LiveClassStatus.ended;
      case LiveClassTab.upcoming:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Classes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () => context.push('/notifications'),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: theme.colorScheme.primary,
          labelColor: theme.colorScheme.primary,
          unselectedLabelColor: theme.colorScheme.onSurfaceVariant,
          tabs: const [
            Tab(text: 'Upcoming', icon: Icon(Icons.schedule)),
            Tab(text: 'Live', icon: Icon(Icons.live_tv)),
            Tab(text: 'Recorded', icon: Icon(Icons.video_library)),
          ],
        ),
      ),
      body: _isLoading && _classes.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () async {
                _page = 1;
                _hasMore = true;
                await _loadClasses();
              },
              child: _classes.isEmpty
                  ? _buildEmptyState(theme)
                  : _buildClassList(theme),
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/live-classes/create'),
        backgroundColor: theme.colorScheme.primary,
        icon: const Icon(Icons.add),
        label: const Text('Schedule'),
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return EduEmptyState(
      icon: Icons.videocam_off,
      title: _currentTab == LiveClassTab.live
          ? 'No Live Classes'
          : _currentTab == LiveClassTab.recorded
              ? 'No Recorded Classes'
              : 'No Upcoming Classes',
      subtitle: _currentTab == LiveClassTab.live
          ? 'There are no classes currently in session.'
          : 'Check back later or schedule a new class.',
    );
  }

  Widget _buildClassList(ThemeData theme) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 200 &&
            _hasMore &&
            !_isLoading) {
          setState(() => _page++);
          _loadClasses();
        }
        return false;
      },
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _classes.length + (_hasMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          if (index >= _classes.length) {
            return const Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              ),
            );
          }
          return _LiveClassCard(
            classItem: _classes[index],
            onTap: () => context.push('/live-classes/${_classes[index].id}'),
          );
        },
      ),
    );
  }
}

class _LiveClassCard extends StatelessWidget {
  final LiveClass classItem;
  final VoidCallback onTap;

  const _LiveClassCard({required this.classItem, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isLive = classItem.isLive;
    final isUpcoming = classItem.isUpcoming;
    final isEnded = classItem.isEnded;

    return EduCard(
      onTap: onTap,
      margin: const EdgeInsets.only(bottom: 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              if (isLive)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.error.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'LIVE',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.error,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                )
              else if (isUpcoming)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    classItem.relativeTime,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              else if (isEnded)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Ended',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSecondaryContainer,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              const Spacer(),
              Text(
                '${classItem.formattedDate} · ${classItem.formattedTime}',
                style: theme.textTheme.labelSmall,
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            classItem.title,
            style: theme.textTheme.titleMedium,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          if (classItem.description != null) ...[
            const SizedBox(height: 4),
            Text(
              classItem.description!,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          if (classItem.subjectTitle != null || classItem.topicTitle != null) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              children: [
                if (classItem.subjectTitle != null)
                  EduBadge(
                    label: classItem.subjectTitle!,
                    icon: Icons.book,
                    backgroundColor: theme.colorScheme.primaryContainer,
                    textColor: theme.colorScheme.onPrimaryContainer,
                  ),
                if (classItem.topicTitle != null)
                  EduBadge(
                    label: classItem.topicTitle!,
                    icon: Icons.tag,
                    backgroundColor: theme.colorScheme.tertiaryContainer,
                    textColor: theme.colorScheme.onTertiaryContainer,
                  ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              if (classItem.teacherName != null) ...[
                CircleAvatar(
                  radius: 16,
                  backgroundColor: theme.colorScheme.primaryContainer,
                  backgroundImage: classItem.teacherAvatar != null
                      ? NetworkImage(classItem.teacherAvatar!)
                      : null,
                  child: classItem.teacherAvatar == null
                      ? Icon(Icons.person, size: 16, color: theme.colorScheme.onPrimaryContainer)
                      : null,
                ),
                const SizedBox(width: 8),
                Text(
                  classItem.teacherName!,
                  style: theme.textTheme.labelMedium,
                ),
                const SizedBox(width: 8),
              ],
              Icon(Icons.timer, size: 14, color: theme.colorScheme.onSurfaceVariant),
              const SizedBox(width: 4),
              Text(
                classItem.formattedDuration,
                style: theme.textTheme.labelSmall,
              ),
              const Spacer(),
              if (classItem.maxParticipants != null) ...[
                Icon(Icons.people, size: 14, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  '${classItem.maxParticipants}',
                  style: theme.textTheme.labelSmall,
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          _buildActionRow(theme, isLive, isUpcoming, isEnded),
        ],
      ),
    );
  }

  Widget _buildActionRow(ThemeData theme, bool isLive, bool isUpcoming, bool isEnded) {
    if (isLive) {
      return Row(
        children: [
          Expanded(
            child: EduButton(
              label: 'Join Class',
              onPressed: () {},
              color: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(width: 8),
          EduButton(
            label: 'Watch',
            onPressed: () {},
            isOutlined: true,
            textColor: theme.colorScheme.primary,
          ),
        ],
      );
    }
    if (isUpcoming) {
      return Row(
        children: [
          Expanded(
            child: EduButton(
              label: 'Remind Me',
              onPressed: () {},
              isOutlined: true,
              textColor: theme.colorScheme.primary,
            ),
          ),
          const SizedBox(width: 8),
          EduButton(
            label: 'Details',
            onPressed: () {},
          ),
        ],
      );
    }
    if (isEnded) {
      return EduButton(
        label: 'View Recording',
        onPressed: () {},
        isOutlined: true,
        textColor: theme.colorScheme.primary,
      );
    }
    return const SizedBox.shrink();
  }
}
