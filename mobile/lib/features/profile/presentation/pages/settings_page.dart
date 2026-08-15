import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile section
          _SettingsSection(
            title: 'Profile',
            items: [
              _SettingsItem(icon: Icons.person, label: 'Edit Profile', onTap: () {}),
              _SettingsItem(icon: Icons.lock, label: 'Change Password', onTap: () {}),
              _SettingsItem(icon: Icons.security, label: 'Security', onTap: () {}),
            ],
          ),
          const SizedBox(height: 16),

          // Preferences section
          _SettingsSection(
            title: 'Preferences',
            items: [
              _SettingsItem(icon: Icons.language, label: 'Language', onTap: () {}, trailing: const Text('English')),
              _SettingsItem(icon: Icons.dark_mode, label: 'Dark Mode', onTap: () {}, trailing: const ToggleSwitch()),
              _SettingsItem(icon: Icons.notifications, label: 'Notifications', onTap: () {}, trailing: const ToggleSwitch(isOn: true)),
            ],
          ),
          const SizedBox(height: 16),

          // Support section
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

          // Account section
          _SettingsSection(
            title: 'Account',
            items: [
              _SettingsItem(icon: Icons.logout, label: 'Logout', onTap: () => _showLogoutDialog(context), isDestructive: true),
              _SettingsItem(icon: Icons.delete, label: 'Delete Account', onTap: () => _showDeleteDialog(context), isDestructive: true),
            ],
          ),

          const SizedBox(height: 24),
          Center(
            child: Text(
              'Version 1.0.0',
              style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
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
            onPressed: () {
              context.pop();
              context.go('/login');
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
          child: Column(
            children: items,
          ),
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

class ToggleSwitch extends StatefulWidget {
  final bool isOn;

  const ToggleSwitch({super.key, this.isOn = false});

  @override
  State<ToggleSwitch> createState() => _ToggleSwitchState();
}

class _ToggleSwitchState extends State<ToggleSwitch> {
  late bool _isOn;

  @override
  void initState() {
    super.initState();
    _isOn = widget.isOn;
  }

  @override
  Widget build(BuildContext context) {
    return Switch(
      value: _isOn,
      onChanged: (value) {
        setState(() => _isOn = value);
      },
    );
  }
}
