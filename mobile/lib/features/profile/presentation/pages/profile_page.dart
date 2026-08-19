import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../di/index.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/index.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _progressOverview;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final storage = ref.read(storageServiceProvider);
      _user = storage.user;

      final progressRepo = ref.read(progressRepositoryProvider);
      final overview = await progressRepo.getOverallProgress();
      if (mounted) {
        setState(() {
          _progressOverview = overview;
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
              : CustomScrollView(
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
                            child: _ProfileAvatar(user: _user),
                          ),
                        ),
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _ProfileInfo(user: _user),
                            const SizedBox(height: 24),
                            _StatsGrid(overview: _progressOverview),
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

class _ProfileAvatar extends StatelessWidget {
  final Map<String, dynamic>? user;
  const _ProfileAvatar({required this.user});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final firstName = user?['firstName'] as String? ?? '';
    final lastName = user?['lastName'] as String? ?? '';
    final initials = ((firstName.isNotEmpty ? firstName[0] : '') + (lastName.isNotEmpty ? lastName[0] : '')).toUpperCase();
    return Column(
      children: [
        CircleAvatar(
          radius: 40,
          backgroundColor: Colors.white.withOpacity(0.2),
          child: Text(
            initials.isNotEmpty ? initials : '?',
            style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '$firstName $lastName'.trim(),
          style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        if (user?['role'] != null)
          Text(
            user!['role'].toString().replaceAll('_', ' ').toUpperCase(),
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
      ],
    );
  }
}

class _ProfileInfo extends StatelessWidget {
  final Map<String, dynamic>? user;
  const _ProfileInfo({required this.user});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final firstName = user?['firstName'] as String? ?? '';
    final lastName = user?['lastName'] as String? ?? '';
    final email = user?['email'] as String? ?? '';
    final phone = user?['phone'] as String? ?? '';
    return EduCard(
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: theme.colorScheme.primaryContainer,
                child: Text(
                  ((firstName.isNotEmpty ? firstName[0] : '') + (lastName.isNotEmpty ? lastName[0] : '')).toUpperCase(),
                  style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.onPrimaryContainer),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$firstName $lastName'.trim(),
                      style: theme.textTheme.titleLarge,
                    ),
                    const SizedBox(height: 4),
                    if (email.isNotEmpty)
                      Row(
                        children: [
                          Icon(Icons.email, size: 14, color: theme.colorScheme.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text(email, style: theme.textTheme.bodySmall),
                        ],
                      ),
                    if (phone.isNotEmpty)
                      Row(
                        children: [
                          Icon(Icons.phone, size: 14, color: theme.colorScheme.onSurfaceVariant),
                          const SizedBox(width: 4),
                          Text(phone, style: theme.textTheme.bodySmall),
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
              _ProfileStat(label: 'Courses', value: '${_progressOverview?['enrolledCourses'] ?? '8'}'),
              _ProfileStat(label: 'Lessons', value: '${_progressOverview?['completedLessons'] ?? '45'}'),
              _ProfileStat(label: 'Streak', value: '${_progressOverview?['studyStreak'] ?? '5'}d'),
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
  final Map<String, dynamic>? overview;
  const _StatsGrid({required this.overview});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final avgScore = (overview?['averageExamScore'] as num?)?.toInt() ?? 85;
    final studyTimeHrs = (overview?['totalStudyHours'] as num?)?.toInt() ?? 24;
    final certificates = (overview?['certificatesEarned'] as num?)?.toInt() ?? 3;
    final rank = (overview?['leaderboardRank'] as num?)?.toInt() ?? 12;

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.5,
      children: [
        _StatTile(icon: Icons.trending_up, label: 'Avg Score', value: '$avgScore%', color: theme.colorScheme.success),
        _StatTile(icon: Icons.timer, label: 'Study Time', value: '${studyTimeHrs}h', color: theme.colorScheme.primary),
        _StatTile(icon: Icons.emoji_events, label: 'Certificates', value: '$certificates', color: theme.colorScheme.warning),
        _StatTile(icon: Icons.leaderboard, label: 'Rank', value: '#$rank', color: theme.colorScheme.secondary),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _StatTile({required this.icon, required this.label, required this.value, required this.color});

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
  const _MenuList();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final items = [
      _MenuItem(icon: Icons.folder, label: 'My Courses', route: '/courses'),
      _MenuItem(icon: Icons.emoji_events, label: 'Certificates', route: '/certificates'),
      _MenuItem(icon: Icons.bookmarks, label: 'Saved Lessons', route: '/saved'),
      _MenuItem(icon: Icons.download, label: 'Downloads', route: '/downloads'),
      _MenuItem(icon: Icons.notifications, label: 'Notifications', route: '/notifications'),
      _MenuItem(icon: Icons.settings, label: 'Settings', route: '/settings'),
      _MenuItem(icon: Icons.help, label: 'Help & Support', route: null),
      _MenuItem(icon: Icons.logout, label: 'Logout', route: null, isDestructive: true),
    ];

    return Column(
      children: items.map((item) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: EduCard(
          onTap: item.route != null ? () => context.push(item.route!) : item.isDestructive ? () => _showLogoutDialog(context) : null,
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
              if (item.route != null) Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      )).toList(),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Logged out')));
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String label;
  final String? route;
  final bool isDestructive;
  const _MenuItem({required this.icon, required this.label, required this.route, this.isDestructive = false});
}
