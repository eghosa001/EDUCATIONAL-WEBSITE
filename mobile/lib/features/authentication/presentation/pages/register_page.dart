import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'login_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  String _selectedRole = 'student';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
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
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Email is required';
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(v)) return 'Invalid email';
                  return null;
                },
                initialValue: _emailController.text,
                onChanged: (v) => _emailController.text = v,
              ),
              const SizedBox(height: 16),
              EduTextFormField(
                labelText: 'Password',
                hintText: 'Create a password',
                prefixIcon: Icons.lock,
                obscureText: true,
                validator: (v) => v == null || v.length < 8 ? 'Password must be 8+ characters' : null,
                initialValue: _passwordController.text,
                onChanged: (v) => _passwordController.text = v,
              ),
              const SizedBox(height: 16),
              Text('I am a:', style: theme.textTheme.titleMedium),
              const SizedBox(height: 8),
              _RoleSelector(selected: _selectedRole, onChanged: (v) => setState(() => _selectedRole = v)),
              const SizedBox(height: 24),
              EduButton(
                label: 'Create Account',
                onPressed: () {
                  if (_formKey.currentState!.validate()) {
                    context.go('/home');
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
      {'value': 'teacher', 'label': 'Teacher', 'icon': Icons.person'},
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
