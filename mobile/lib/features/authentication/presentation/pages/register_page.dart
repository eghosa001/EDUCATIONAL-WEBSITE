import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/blocs/index.dart';
import '../../../core/constants/app_enums.dart';
import '../../../core/utils/validators.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  String _selectedRole = 'student';

  UserRole _parseRole(String role) {
    switch (role) {
      case 'parent':
        return UserRole.parent;
      case 'teacher':
        return UserRole.teacher;
      case 'student':
      default:
        return UserRole.student;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final authState = ref.watch(authNotifierProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Create Account')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              EduTextFormField(
                labelText: 'First Name',
                hintText: 'Enter your first name',
                prefixIcon: Icons.person,
                validator: (v) => v == null || v.length < 2 ? 'Name too short' : null,
                initialValue: _firstNameController.text,
                onChanged: (v) => _firstNameController.text = v,
              ),
              const SizedBox(height: 16),
              EduTextFormField(
                labelText: 'Last Name',
                hintText: 'Enter your last name',
                prefixIcon: Icons.person_outline,
                validator: (v) => v == null || v.length < 2 ? 'Name too short' : null,
                initialValue: _lastNameController.text,
                onChanged: (v) => _lastNameController.text = v,
              ),
              const SizedBox(height: 16),
              EduTextFormField(
                labelText: 'Email',
                hintText: 'Enter your email',
                prefixIcon: Icons.email,
                keyboardType: TextInputType.emailAddress,
                validator: StringValidators.emailValidator,
                initialValue: _emailController.text,
                onChanged: (v) => _emailController.text = v,
              ),
              const SizedBox(height: 16),
              EduTextFormField(
                labelText: 'Password',
                hintText: 'Create a password',
                prefixIcon: Icons.lock,
                obscureText: true,
                validator: StringValidators.passwordValidator,
                initialValue: _passwordController.text,
                onChanged: (v) => _passwordController.text = v,
              ),
              const SizedBox(height: 16),
              Text('I am a:', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              _RoleSelector(selected: _selectedRole, onChanged: (v) => setState(() => _selectedRole = v)),
              const SizedBox(height: 24),
              if (authState.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    authState.error!,
                    style: TextStyle(color: theme.colorScheme.error, fontSize: 14),
                  ),
                ),
              EduButton(
                label: 'Create Account',
                isLoading: authState.isLoading,
                onPressed: () async {
                  if (_formKey.currentState!.validate()) {
                    await ref.read(authNotifierProvider.notifier).register(
                      email: _emailController.text.trim(),
                      password: _passwordController.text,
                      firstName: _firstNameController.text.trim(),
                      lastName: _lastNameController.text.trim(),
                      role: _parseRole(_selectedRole),
                    );
                    final state = ref.read(authNotifierProvider);
                    if (state.isAuthenticated && mounted) {
                      context.go('/verify-email');
                    }
                  }
                },
              ),
              const SizedBox(height: 16),
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text('Already have an account? '),
                    TextButton(onPressed: () => context.pop(), child: const Text('Sign In')),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleSelector extends StatelessWidget {
  final String selected;
  final ValueChanged<String> onChanged;

  const _RoleSelector({required this.selected, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final roles = [
      {'value': 'student', 'label': 'Student', 'icon': Icons.school},
      {'value': 'parent', 'label': 'Parent', 'icon': Icons.family_restroom},
      {'value': 'teacher', 'label': 'Teacher', 'icon': Icons.person},
    ];

    return Wrap(
      spacing: 12,
      runSpacing: 12,
      children: roles.map((role) {
        final isSelected = selected == role['value'];
        return GestureDetector(
          onTap: () => onChanged(role['value'] as String),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isSelected ? Theme.of(context).colorScheme.primary : Colors.grey.shade300),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(role['icon'] as IconData, size: 20, color: isSelected ? Colors.white : null),
                const SizedBox(width: 8),
                Text(role['label'] as String, style: TextStyle(color: isSelected ? Colors.white : null)),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
