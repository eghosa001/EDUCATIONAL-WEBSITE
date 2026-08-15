import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class ProfilePage extends ConsumerWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180,
            floating: false,
            pinned: true,
            backgroundColor: theme.colorScheme.primary,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text('Profile'),
              background: Container(
                color: theme.colorScheme.primary,
                child: Center(
                  child: CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white.withOpacity(0.2),
                    child: const Icon(Icons.person, size: 50, color: Colors.white),
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _ProfileInfo(),
                  const SizedBox(height: 24),
                  _StatsGrid(),
                  const SizedBox(height: 24),
                  _MenuList(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileInfo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: theme.colorScheme.primaryContainer,
                child: const Icon(Icons.person, size: 30, color: Colors.white),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Student Name',
                      style: theme.textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.email, size: 14, color: theme.colorScheme.onSurfaceVariant),
                        const SizedBox(width: 4),
                        Text('student@example.com', style: theme.textTheme.bodySmall),
                      ],
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () => context.push('/settings'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _ProfileStat(label: 'Courses', value: '8'),
              _ProfileStat(label: 'Lessons', value: '45'),
              _ProfileStat(label: 'Streak', value: '5d'),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileStat extends StatelessWidget {
  final String label;
  final String value;

  const _ProfileStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.titleLarge),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _StatsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _StatTile(icon: Icons.trending_up, label: 'Avg Score', value: '85%', color: theme.colorScheme.success),
        _StatTile(icon: Icons.timer, label: 'Study Time', value: '24h', color: theme.colorScheme.primary),
        _StatTile(icon: Icons.emoji_events, label: 'Certificates', value: '3', color: theme.colorScheme.warning),
        _StatTile(icon: Icons.leaderboard, label: 'Rank', value: '#12', color: theme.colorScheme.secondary),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Row(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(value, style: theme.textTheme.titleMedium),
                Text(label, style: theme.textTheme.labelSmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MenuList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = [
      _MenuItem(icon: Icons.folder, label: 'My Courses', onTap: () => context.push('/courses')),
      _MenuItem(icon: Icons.emoji_events, label: 'Certificates', onTap: () => context.push('/certificates')),
      _MenuItem(icon: Icons.bookmarks, label: 'Saved Lessons', onTap: () => context.push('/saved')),
      _MenuItem(icon: Icons.download, label: 'Downloads', onTap: () => context.push('/downloads')),
      _MenuItem(icon: Icons.notifications, label: 'Notifications', onTap: () => context.push('/notifications')),
      _MenuItem(icon: Icons.help, label: 'Help & Support', onTap: () {}),
      _MenuItem(icon: Icons.logout, label: 'Logout', onTap: () {}, isDestructive: true),
    ];

    return Column(
      children: items.map((item) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: EduCard(
          onTap: item.onTap,
          child: Row(
            children: [
              Icon(item.icon, color: item.isDestructive ? theme.colorScheme.error : theme.colorScheme.primary),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  item.label,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: item.isDestructive ? theme.colorScheme.error : null,
                  ),
                ),
              ),
              Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      )).toList(),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isDestructive;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isDestructive = false,
  });
}
