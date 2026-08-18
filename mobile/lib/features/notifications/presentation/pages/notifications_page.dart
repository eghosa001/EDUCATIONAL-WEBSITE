import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';
import '../../shared/repositories/index.dart';

class NotificationsPage extends ConsumerStatefulWidget {
  const NotificationsPage({super.key});

  @override
  ConsumerState<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends ConsumerState<NotificationsPage> {
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  int _page = 1;
  bool _hasMore = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications([bool refresh = false]) async {
    if (_isLoading && !refresh) return;
    setState(() {
      _isLoading = refresh;
      _isLoadingMore = !refresh;
      if (refresh) _page = 1;
    });
    try {
      final repo = ref.read(notificationRepositoryProvider);
      final result = await repo.getNotifications(
        page: _page,
        limit: 20,
        unreadOnly: false,
      );
      final data = result['notifications'] as List? ?? [];
      if (mounted) {
        setState(() {
          if (refresh) {
            _notifications = data.cast<Map<String, dynamic>>();
          } else {
            _notifications.addAll(data.cast<Map<String, dynamic>>());
          }
          _hasMore = data.length >= 20;
          _error = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _error = e.toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load notifications: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _isLoadingMore = false;
        });
      }
    }
  }

  Future<void> _markAsRead(String id) async {
    try {
      final repo = ref.read(notificationRepositoryProvider);
      await repo.markAsRead(id);
      setState(() {
        final idx = _notifications.indexWhere((n) => n['id'] == id);
        if (idx != -1) {
          _notifications[idx] = {..._notifications[idx], 'isRead': true};
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to mark as read: $e')),
      );
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final repo = ref.read(notificationRepositoryProvider);
      await repo.markAllAsRead();
      setState(() => _notifications = _notifications.map((n) => {...n, 'isRead': true}).toList());
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('All notifications marked as read')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to mark all as read: $e')),
      );
    }
  }

  Future<void> _deleteNotification(String id) async {
    try {
      final repo = ref.read(notificationRepositoryProvider);
      await repo.deleteNotification(id);
      setState(() => _notifications.removeWhere((n) => n['id'] == id));
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete: $e')),
      );
    }
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'quiz':
      case 'exam':
        return Icons.quiz;
      case 'assignment':
        return Icons.assignment;
      case 'achievement':
      case 'badge':
        return Icons.emoji_events;
      case 'payment':
      case 'subscription':
        return Icons.payment;
      case 'event':
        return Icons.event;
      case 'message':
      case 'community':
        return Icons.message;
      case 'certificate':
        return Icons.verified;
      case 'system':
        return Icons.info;
      default:
        return Icons.notifications;
    }
  }

  Color _getColor(String type) {
    switch (type) {
      case 'quiz':
      case 'exam':
        return Colors.blue;
      case 'assignment':
        return Colors.orange;
      case 'achievement':
      case 'badge':
        return Colors.amber;
      case 'payment':
      case 'subscription':
        return Colors.green;
      case 'event':
        return Colors.purple;
      case 'message':
      case 'community':
        return Colors.teal;
      case 'certificate':
        return Colors.indigo;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _markAllAsRead,
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: _error == null && _notifications.isEmpty && !_isLoading
          ? EduEmptyState(
              icon: Icons.notifications_off,
              title: 'No Notifications',
              subtitle: 'You are all caught up!',
            )
          : RefreshIndicator(
              onRefresh: () => _loadNotifications(true),
              child: NotificationListener<ScrollNotification>(
                onNotification: (notification) {
                  if (notification is ScrollEndNotification &&
                      notification.metrics.extentAfter < 200 &&
                      _hasMore &&
                      !_isLoadingMore) {
                    setState(() => _page++);
                    _loadNotifications();
                  }
                  return false;
                },
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _notifications.length + (_isLoadingMore ? 1 : 0),
                  itemBuilder: (context, index) {
                    if (index >= _notifications.length) {
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
                    final notification = _notifications[index];
                    final type = notification['type'] as String? ?? 'system';
                    return Dismissible(
                      key: Key(notification['id'] as String),
                      direction: DismissDirection.endToStart,
                      background: Container(
                        alignment: Alignment.centerRight,
                        padding: const EdgeInsets.only(right: 16),
                        color: theme.colorScheme.error,
                        child: const Icon(Icons.delete, color: Colors.white),
                      ),
                      onDismissed: (_) => _deleteNotification(notification['id'] as String),
                      child: _NotificationItem(
                        icon: _getIcon(type),
                        iconColor: _getColor(type),
                        title: notification['title'] as String? ?? 'Notification',
                        message: notification['message'] as String? ?? '',
                        time: notification['relativeTime'] as String? ??
                            notification['createdAt'] != null
                                ? _formatRelativeTime(DateTime.parse(notification['createdAt'] as String))
                                : '',
                        isRead: notification['isRead'] == true,
                        onTap: () {
                          if (!notification['isRead'] as bool? ?? false) {
                            _markAsRead(notification['id'] as String);
                          }
                          final action = notification['action'];
                          if (action != null) {
                            context.push(action);
                          }
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
    );
  }

  String _formatRelativeTime(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${(diff.inDays / 7).floor()}w ago';
  }
}

class _NotificationItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String message;
  final String time;
  final bool isRead;
  final VoidCallback onTap;

  const _NotificationItem({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.message,
    required this.time,
    required this.isRead,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: EduCard(
        onTap: onTap,
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                          ),
                        ),
                      ),
                      Text(time, style: theme.textTheme.labelSmall),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    message,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            if (!isRead)
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
