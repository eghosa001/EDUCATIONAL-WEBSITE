import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../di/providers.dart';
import '../../../shared/repositories/authentication_repository.dart';

class SettingsPage extends ConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final language = ref.watch(languageProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _SettingsSection(
            title: 'Profile',
            items: [
              _SettingsItem(icon: Icons.person, label: 'Edit Profile', onTap: () => context.push('/profile')),
              _SettingsItem(icon: Icons.lock, label: 'Change Password', onTap: () => context.push('/forgot-password')),
            ],
          ),
          const SizedBox(height: 16),

          _SettingsSection(
            title: 'Preferences',
            items: [
              _SettingsItem(
                icon: Icons.language,
                label: 'Language',
                onTap: () => _showLanguageDialog(context, ref, language),
                trailing: Text(_languageLabel(language)),
              ),
              _SettingsItem(
                icon: Icons.dark_mode,
                label: 'Dark Mode',
                trailing: Switch(
                  value: themeMode == ThemeMode.dark,
                  onChanged: (value) {
                    ref.read(themeModeProvider.notifier).state =
                        value ? ThemeMode.dark : ThemeMode.light;
                  },
                ),
              ),
              _SettingsItem(
                icon: Icons.notifications,
                label: 'Notifications',
                trailing: Switch(
                  value: true,
                  onChanged: (value) {},
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          _SettingsSection(
            title: 'Support',
            items: [
              _SettingsItem(icon: Icons.help, label: 'Help Center', onTap: () {}),
              _SettingsItem(icon: Icons.chat, label: 'Contact Support', onTap: () {}),
              _SettingsItem(icon: Icons.rate_review, label: 'Rate App', onTap: () {}),
              _SettingsItem(icon: Icons.info, label: 'About', onTap: () {}),
            ],
          ),
          const SizedBox(height: 16),

          _SettingsSection(
            title: 'Account',
            items: [
              _SettingsItem(
                icon: Icons.logout,
                label: 'Logout',
                onTap: () => _showLogoutDialog(context, ref),
                isDestructive: true,
              ),
              _SettingsItem(
                icon: Icons.delete,
                label: 'Delete Account',
                onTap: () => _showDeleteDialog(context),
                isDestructive: true,
              ),
            ],
          ),

          const SizedBox(height: 24),
          Center(
            child: Text(
              'Version 1.0.0',
              style: theme.of(context).textTheme.labelSmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  String _languageLabel(String lang) {
    switch (lang) {
      case 'ha':
        return 'Hausa';
      case 'yo':
        return 'Yoruba';
      case 'ig':
        return 'Igbo';
      default:
        return 'English';
    }
  }

  void _showLanguageDialog(BuildContext context, WidgetRef ref, String current) {
    final languages = [
      {'code': 'en', 'label': 'English'},
      {'code': 'ha', 'label': 'Hausa'},
      {'code': 'yo', 'label': 'Yoruba'},
    ];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Language'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: languages.map((lang) => RadioListTile<String>(
            title: Text(lang['label']!),
            value: lang['code']!,
            groupValue: current,
            onChanged: (value) {
              if (value != null) {
                ref.read(languageProvider.notifier).state = value;
              }
              Navigator.pop(context);
            },
          )).toList(),
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(onPressed: () => context.pop(), child: const Text('Cancel')),
          EduButton(
            label: 'Logout',
            width: 100,
            onPressed: () async {
              context.pop();
              await ref.read(authenticationRepositoryProvider).logout();
              if (context.mounted) {
                ref.read(authStateProvider.notifier).state = false;
                ref.read(userProvider.notifier).state = null;
                context.go('/login');
              }
            },
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text('Are you sure you want to delete your account? This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => context.pop(), child: const Text('Cancel')),
          EduButton(
            label: 'Delete',
            width: 100,
            color: Theme.of(context).colorScheme.error,
            onPressed: () {
              context.pop();
              context.go('/login');
            },
          ),
        ],
      ),
    );
  }
}

class _SettingsSection extends StatelessWidget {
  final String title;
  final List<Widget> items;

  const _SettingsSection({required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
        const SizedBox(height: 8),
        EduCard(
          child: Column(children: items),
        ),
      ],
    );
  }
}

class _SettingsItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final Widget? trailing;
  final VoidCallback onTap;
  final bool isDestructive;

  const _SettingsItem({
    required this.icon,
    required this.label,
    this.trailing,
    required this.onTap,
    this.isDestructive = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      leading: Icon(icon, color: isDestructive ? theme.colorScheme.error : theme.colorScheme.primary),
      title: Text(label, style: theme.textTheme.titleSmall?.copyWith(color: isDestructive ? theme.colorScheme.error : null)),
      trailing: trailing ?? Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
      onTap: onTap,
    );
  }
}
