import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class NotificationsPage extends StatelessWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('Mark all read'),
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 8,
        itemBuilder: (context, index) {
          return _NotificationItem(
            icon: _getNotificationIcon(index),
            title: _getNotificationTitle(index),
            message: _getNotificationMessage(index),
            time: _getNotificationTime(index),
            isRead: index > 3,
            onTap: () {},
          );
        },
      ),
    );
  }

  IconData _getNotificationIcon(int index) {
    return [Icons.quiz, Icons.assignment, Icons.star, Icons.payment, Icons.event, Icons.message, Icons.emoji_events, Icons.info][index];
  }

  String _getNotificationTitle(int index) {
    return ['Quiz Reminder', 'Assignment Due', 'Achievement Unlocked', 'Payment Successful', 'Exam Scheduled', 'New Message', 'Certificate Ready', 'System Update'][index];
  }

  String _getNotificationMessage(int index) {
    return [
      'Biology quiz starts in 30 minutes',
      'Mathematics assignment due tomorrow',
      'You earned the "Top Student" badge!',
      'Your subscription payment was successful',
      'Physics exam scheduled for Dec 15',
      'Adebayo sent you a message',
      'Your Biology certificate is ready',
      'New features have been added',
    ][index];
  }

  String _getNotificationTime(int index) {
    return ['5 min ago', '1 hour ago', '2 hours ago', '1 day ago', '2 days ago', '3 days ago', '1 week ago', '2 weeks ago'][index];
  }
}

class _NotificationItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final String time;
  final bool isRead;
  final VoidCallback onTap;

  const _NotificationItem({
    required this.icon,
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
                color: isRead ? Colors.grey.shade100 : theme.colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: isRead ? Colors.grey : theme.colorScheme.primary, size: 20),
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
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                  ),
                ],
              ),
            ),
            if (!isRead)
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Colors.blue,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
