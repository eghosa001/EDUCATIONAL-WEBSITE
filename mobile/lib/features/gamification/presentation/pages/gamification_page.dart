import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class GamificationPage extends StatelessWidget {
  const GamificationPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Achievements')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // XP & Level
            _XPSection(),
            const SizedBox(height: 24),

            // Badges
            Text('Badges', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _BadgesGrid(),
            const SizedBox(height: 24),

            // Leaderboard
            Text('Leaderboard', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _Leaderboard(),
            const SizedBox(height: 24),

            // Achievements
            Text('Recent Achievements', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            _AchievementsList(),
          ],
        ),
      ),
    );
  }
}

class _XPSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _XPCircle(xp: 1250, level: 12),
              Column(
                children: [
                  Text('1,250 XP', style: theme.textTheme.titleLarge),
                  Text('Level 12', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  EduBadge(
                    label: 'Gold Member',
                    backgroundColor: Colors.amber,
                    textColor: Colors.black,
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Progress to Level 13', style: theme.textTheme.labelMedium),
                  Text('1,250 / 1,500 XP', style: theme.textTheme.labelSmall),
                ],
              ),
              const SizedBox(height: 4),
              EduProgressBar(progress: 1250 / 1500),
            ],
          ),
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
          ],
        ),
      ),
    );
  }
}

class _BadgesGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final badges = [
      {'icon': Icons.trophy, 'name': 'First Win', 'color': Colors.amber, 'earned': true},
      {'icon': Icons.streak, 'name': '7-Day Streak', 'color': Colors.orange, 'earned': true},
      {'icon': Icons.emoji_events, 'name': 'Top 10%', 'color': Colors.purple, 'earned': true},
      {'icon': Icons.workspace_premium, 'name': 'Perfect Score', 'color': Colors.blue, 'earned': true},
      {'icon': Icons.school, 'name': 'Course Complete', 'color': Colors.green, 'earned': true},
      {'icon': Icons.favorite, 'name': 'Helper', 'color': Colors.pink, 'earned': false},
      {'icon': Icons.lightbulb, 'name': 'Quick Learner', 'color': Colors.amber, 'earned': false},
      {'icon': Icons.verified, 'name': 'Verified', 'color': Colors.blue, 'earned': false},
    ];

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
        final badge = badges[index];
        return _BadgeTile(
          icon: badge['icon'] as IconData,
          name: badge['name'] as String,
          color: badge['color'] as Color,
          earned: badge['earned'] as bool,
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

class _Leaderboard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final users = [
      {'name': 'Adebayo O.', 'xp': 2500, 'rank': 1},
      {'name': 'Fatima M.', 'xp': 2200, 'rank': 2},
      {'name': 'Chinedu K.', 'xp': 1900, 'rank': 3},
      {'name': 'You', 'xp': 1250, 'rank': 12},
      {'name': 'Amina B.', 'xp': 1100, 'rank': 13},
    ];

    return EduCard(
      child: Column(
        children: users.map((user) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Text(
                  '#${user['rank']}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: user['rank'] == 1 ? Colors.amber : user['rank'] == 2 ? Colors.grey : user['rank'] == 3 ? Colors.brown : theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(width: 12),
                CircleAvatar(
                  backgroundColor: user['name'] == 'You' ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHighest,
                  child: Text(user['name'][0], style: theme.textTheme.labelLarge?.copyWith(color: user['name'] == 'You' ? Colors.white : null)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(user['name']!, style: theme.textTheme.titleSmall),
                ),
                Text('${user['xp']} XP', style: theme.textTheme.labelLarge),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _AchievementsList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final achievements = [
      {'title': 'Completed 50 lessons', 'icon': Icons.play_circle, 'date': 'Dec 10'},
      {'title': '14-day streak', 'icon': Icons.local_fire_department, 'date': 'Dec 8'},
      {'title': '10,000 XP earned', 'icon': Icons.star, 'date': 'Dec 5'},
      {'title': '90% Biology score', 'icon': Icons.emoji_events, 'date': 'Dec 1'},
    ];

    return Column(
      children: achievements.map((a) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: EduCard(
            child: Row(
              children: [
                Icon(a['icon'] as IconData, color: theme.colorScheme.warning),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a['title'] as String, style: theme.textTheme.titleSmall),
                      Text(a['date'] as String, style: theme.textTheme.labelSmall),
                    ],
                  ),
                ),
                const Icon(Icons.check_circle, color: Colors.green),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
