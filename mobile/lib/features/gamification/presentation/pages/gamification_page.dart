import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../shared/widgets/index.dart';
import '../../../../shared/repositories/index.dart';
import '../../../../core/utils/date_formatter.dart';
import '../../../../core/constants/index.dart';

class GamificationPage extends ConsumerWidget {
  const GamificationPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Achievements')),
      body: const _GamificationBody(),
    );
  }
}

class _GamificationBody extends ConsumerStatefulWidget {
  const _GamificationBody();

  @override
  ConsumerState<_GamificationBody> createState() => _GamificationBodyState();
}

class _GamificationBodyState extends ConsumerState<_GamificationBody> {
  Map<String, dynamic> _points = {};
  Map<String, dynamic> _streak = {};
  List<Map<String, dynamic>> _leaderboard = [];
  List<Map<String, dynamic>> _earnedBadges = [];
  List<Map<String, dynamic>> _achievements = [];
  Set<String> _earnedAchievementIds = {};
  List<Map<String, dynamic>> _rewards = [];
  List<Map<String, dynamic>> _pointsHistory = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    try {
      final repo = ref.read(gamificationRepositoryProvider);
      final results = await Future.wait([
        repo.getMyPoints(),
        repo.getMyStreak(),
        repo.getLeaderboard(limit: 10),
        repo.getMyBadges(limit: 50),
        repo.getAchievements(),
        repo.getMyAchievements(limit: 50),
        repo.getRewards(),
        repo.getPointsHistory(limit: 20),
      ]);

      final earnedAchievements = results[5] as List<Map<String, dynamic>>;
      if (mounted) {
        setState(() {
          _points = results[0] as Map<String, dynamic>;
          _streak = results[1] as Map<String, dynamic>;
          _leaderboard = results[2] as List<Map<String, dynamic>>;
          _earnedBadges = results[3] as List<Map<String, dynamic>>;
          _achievements = results[4] as List<Map<String, dynamic>>;
          _earnedAchievementIds = earnedAchievements
              .map((a) => a['achievementId'].toString())
              .toSet();
          _rewards = results[6] as List<Map<String, dynamic>>;
          _pointsHistory = results[7] as List<Map<String, dynamic>>;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load gamification: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _redeemReward(Map<String, dynamic> reward) async {
    try {
      await ref.read(gamificationRepositoryProvider).redeemReward(reward['id'].toString());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${reward['name']} redeemed successfully')),
      );
      _loadData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to redeem reward: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final theme = Theme.of(context);
    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _XPSection(points: _points),
            const SizedBox(height: 16),
            _StreakCard(streak: _streak),
            const SizedBox(height: 24),

            Text('Badges', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _BadgesGrid(badges: _earnedBadges),
            const SizedBox(height: 24),

            Text('Leaderboard', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _Leaderboard(entries: _leaderboard),
            const SizedBox(height: 24),

            Text('Achievements', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _AchievementsList(
              achievements: _achievements,
              earnedIds: _earnedAchievementIds,
            ),
            const SizedBox(height: 24),

            Text('Rewards Store', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _RewardsSection(
              rewards: _rewards,
              totalPoints: _points['totalPoints'] as int? ?? 0,
              onRedeem: _redeemReward,
            ),
            const SizedBox(height: 24),

            Text('Points History', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _PointsHistory(history: _pointsHistory),
          ],
        ),
      ),
    );
  }
}

// ============ LEVEL HELPERS ============

int _computeLevel(int xp) {
  if (xp >= 1000) return 10;
  if (xp >= 500) return 5;
  if (xp >= 100) return 3;
  if (xp >= 50) return 2;
  return 1;
}

int _levelMinXp(int level) {
  switch (level) {
    case 10:
      return 1000;
    case 5:
      return 500;
    case 3:
      return 100;
    case 2:
      return 50;
    default:
      return 0;
  }
}

int _nextLevelXp(int level) {
  switch (level) {
    case 1:
      return 50;
    case 2:
      return 100;
    case 3:
      return 500;
    case 5:
      return 1000;
    default:
      return 1500;
  }
}

IconData _badgeIcon(String name) {
  final n = name.toLowerCase();
  if (n.contains('streak')) return Icons.local_fire_department;
  if (n.contains('first')) return Icons.military_tech;
  if (n.contains('perfect') || n.contains('score')) return Icons.workspace_premium;
  if (n.contains('top')) return Icons.emoji_events;
  if (n.contains('course') || n.contains('complete')) return Icons.school;
  if (n.contains('quiz') || n.contains('exam')) return Icons.quiz;
  if (n.contains('lesson')) return Icons.play_circle;
  if (n.contains('share') || n.contains('social')) return Icons.share;
  return Icons.emoji_events;
}

Color _badgeColor(int index, {bool earned = true}) {
  if (!earned) return Colors.grey;
  const colors = [
    Colors.amber,
    Colors.orange,
    Colors.purple,
    Colors.blue,
    Colors.green,
    Colors.pink,
    Colors.teal,
  ];
  return colors[index % colors.length];
}

// ============ XP & LEVEL ============

class _XPSection extends StatelessWidget {
  final Map<String, dynamic> points;

  const _XPSection({required this.points});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = points['totalPoints'] as int? ?? 0;
    final level = _computeLevel(total);
    final minXp = _levelMinXp(level);
    final nextXp = _nextLevelXp(level);
    final progress = ((total - minXp) / (nextXp - minXp)).clamp(0.0, 1.0).toDouble();

    return EduCard(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _XPCircle(xp: total, level: level),
              Column(
                children: [
                  Text('$total XP', style: theme.textTheme.titleLarge),
                  Text('Level $level', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  EduBadge(
                    label: total >= 1000 ? 'Elite Member' : total >= 100 ? 'Gold Member' : 'Rising Star',
                    backgroundColor: Colors.amber,
                    textColor: Colors.black,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _MiniStat(label: 'Today', value: '${points['dailyPoints'] as int? ?? 0} XP'),
              _MiniStat(label: 'This Week', value: '${points['weeklyPoints'] as int? ?? 0} XP'),
              _MiniStat(label: 'This Month', value: '${points['monthlyPoints'] as int? ?? 0} XP'),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Progress to Level ${level == 10 ? 10 : level + 1}', style: theme.textTheme.labelMedium),
              Text('$total / $nextXp XP', style: theme.textTheme.labelSmall),
            ],
          ),
          const SizedBox(height: 4),
          EduProgressBar(progress: progress, height: 8),
        ],
      ),
    );
  }
}

class _XPCircle extends StatelessWidget {
  final int xp;
  final int level;

  const _XPCircle({required this.xp, required this.level});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Theme.of(context).colorScheme.primaryContainer,
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('$level', style: Theme.of(context).textTheme.headlineMedium),
            Text('Level', style: Theme.of(context).textTheme.labelSmall),
            Text('$xp XP', style: Theme.of(context).textTheme.labelSmall?.copyWith(fontSize: 10)),
          ],
        ),
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;

  const _MiniStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Text(value, style: theme.textTheme.titleSmall),
        Text(label, style: theme.textTheme.labelSmall),
      ],
    );
  }
}

// ============ STREAK ============

class _StreakCard extends StatelessWidget {
  final Map<String, dynamic> streak;

  const _StreakCard({required this.streak});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final current = streak['currentStreak'] as int? ?? 0;
    final longest = streak['longestStreak'] as int? ?? 0;
    final lastActive = streak['lastActivityDate'] as String?;

    return EduCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.warning.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(Icons.local_fire_department, color: AppColors.warning, size: 32),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('$current day${current == 1 ? '' : 's'} streak',
                    style: theme.textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  'Longest: $longest day${longest == 1 ? '' : 's'}${lastActive != null ? ' · Last active ${DateFormatter().shortDate(DateTime.parse(lastActive))}' : ''}',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ============ BADGES ============

class _BadgesGrid extends StatelessWidget {
  final List<Map<String, dynamic>> badges;

  const _BadgesGrid({required this.badges});

  @override
  Widget build(BuildContext context) {
    if (badges.isEmpty) {
      return const EduEmptyState(
        icon: Icons.workspace_premium,
        title: 'No badges yet',
        subtitle: 'Complete lessons, quizzes and exams to earn badges.',
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 4,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: badges.length,
      itemBuilder: (context, index) {
        final badge = badges[index]['badge'] as Map<String, dynamic>? ?? badges[index];
        final name = badge['name'] as String? ?? 'Badge';
        return _BadgeTile(
          icon: _badgeIcon(name),
          name: name,
          color: _badgeColor(index),
          earned: true,
        );
      },
    );
  }
}

class _BadgeTile extends StatelessWidget {
  final IconData icon;
  final String name;
  final Color color;
  final bool earned;

  const _BadgeTile({
    required this.icon,
    required this.name,
    required this.color,
    required this.earned,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: earned ? color.withOpacity(0.2) : Colors.grey.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(
            icon,
            color: earned ? color : Colors.grey,
            size: 28,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          name,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: earned ? null : Colors.grey,
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
        ),
      ],
    );
  }
}

// ============ LEADERBOARD ============

class _Leaderboard extends StatelessWidget {
  final List<Map<String, dynamic>> entries;

  const _Leaderboard({required this.entries});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (entries.isEmpty) {
      return const EduEmptyState(
        icon: Icons.emoji_events,
        title: 'No leaderboard data',
      );
    }

    return EduCard(
      child: Column(
        children: entries.map((user) {
          final rank = user['rank'] as int? ?? 0;
          final name = user['userName'] as String? ?? 'Student';
          final points = user['points'] as int? ?? 0;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Text(
                  '#$rank',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: rank == 1
                        ? Colors.amber
                        : rank == 2
                            ? Colors.grey
                            : rank == 3
                                ? Colors.brown
                                : theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(width: 12),
                CircleAvatar(
                  backgroundColor: rank <= 3
                      ? theme.colorScheme.primary
                      : theme.colorScheme.surfaceContainerHighest,
                  child: Text(name.isNotEmpty ? name[0] : '?',
                      style: theme.textTheme.labelLarge?.copyWith(
                        color: rank <= 3 ? Colors.white : null,
                      )),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(name, style: theme.textTheme.titleSmall),
                ),
                Text('$points XP', style: theme.textTheme.labelLarge),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

// ============ ACHIEVEMENTS ============

class _AchievementsList extends StatelessWidget {
  final List<Map<String, dynamic>> achievements;
  final Set<String> earnedIds;

  const _AchievementsList({
    required this.achievements,
    required this.earnedIds,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (achievements.isEmpty) {
      return const EduEmptyState(
        icon: Icons.star,
        title: 'No achievements available',
      );
    }

    return Column(
      children: achievements.map((a) {
        final name = a['name'] as String? ?? 'Achievement';
        final description = a['description'] as String? ?? '';
        final earned = earnedIds.contains(a['id'].toString());
        final points = a['points'] as int? ?? 0;
        final color = _badgeColor(achievements.indexOf(a), earned: earned);
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                Icon(_badgeIcon(name), color: earned ? color : Colors.grey),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: theme.textTheme.titleSmall),
                      Text(description, style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
                if (points > 0)
                  EduBadge(label: '$points XP', backgroundColor: color.withOpacity(0.15)),
                const SizedBox(width: 8),
                Icon(
                  earned ? Icons.check_circle : Icons.lock_outline,
                  color: earned ? Colors.green : Colors.grey,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ============ REWARDS STORE ============

class _RewardsSection extends StatelessWidget {
  final List<Map<String, dynamic>> rewards;
  final int totalPoints;
  final void Function(Map<String, dynamic> reward) onRedeem;

  const _RewardsSection({
    required this.rewards,
    required this.totalPoints,
    required this.onRedeem,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (rewards.isEmpty) {
      return const EduEmptyState(
        icon: Icons.card_giftcard,
        title: 'No rewards available',
      );
    }

    return Column(
      children: rewards.map((reward) {
        final name = reward['name'] as String? ?? 'Reward';
        final description = reward['description'] as String? ?? '';
        final cost = reward['points_cost'] as int? ?? 0;
        final affordable = totalPoints >= cost;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(Icons.card_giftcard, color: AppColors.secondary),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: theme.textTheme.titleSmall),
                      Text(description, style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
                EduButton(
                  label: '$cost XP',
                  isOutlined: !affordable,
                  isDisabled: !affordable,
                  onPressed: affordable ? () => onRedeem(reward) : null,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ============ POINTS HISTORY ============

class _PointsHistory extends StatelessWidget {
  final List<Map<String, dynamic>> history;

  const _PointsHistory({required this.history});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    if (history.isEmpty) {
      return const EduEmptyState(
        icon: Icons.history,
        title: 'No points activity yet',
      );
    }

    return EduCard(
      child: Column(
        children: history.take(10).map((entry) {
          final points = entry['points'] as int? ?? 0;
          final description = entry['description'] as String? ?? entry['action'] as String? ?? 'Points earned';
          final createdAt = entry['created_at'] as String? ?? entry['createdAt'] as String?;
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Icon(
                  points >= 0 ? Icons.add_circle : Icons.remove_circle,
                  color: points >= 0 ? AppColors.success : AppColors.error,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(description, style: theme.textTheme.titleSmall),
                      if (createdAt != null)
                        Text(
                          DateFormatter().relativeTime(DateTime.parse(createdAt)),
                          style: theme.textTheme.labelSmall,
                        ),
                    ],
                  ),
                ),
                Text(
                  '${points >= 0 ? '+' : ''}$points XP',
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: points >= 0 ? AppColors.success : AppColors.error,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}
