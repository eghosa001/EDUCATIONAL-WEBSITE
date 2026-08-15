import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/index.dart';

class ForgotPasswordPage extends StatelessWidget {
  const ForgotPasswordPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Forgot Password')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.lock_open, size: 64, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'Reset your password',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Enter your email address and we\'ll send you a link to reset your password.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            EduTextFormField(
              labelText: 'Email',
              hintText: 'Enter your email',
              prefixIcon: Icons.email,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 24),
            EduButton(
              label: 'Send Reset Link',
              onPressed: () => context.push('/reset-password'),
            ),
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: () => context.pop(),
                child: const Text('Back to Login'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ResetPasswordPage extends StatelessWidget {
  const ResetPasswordPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Reset Password')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.lock, size: 64, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'Create new password',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Your new password must be different from previously used passwords.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            EduTextFormField(
              labelText: 'New Password',
              hintText: 'Enter new password',
              prefixIcon: Icons.lock,
              obscureText: true,
            ),
            const SizedBox(height: 16),
            EduTextFormField(
              labelText: 'Confirm Password',
              hintText: 'Confirm new password',
              prefixIcon: Icons.lock_outline,
              obscureText: true,
            ),
            const SizedBox(height: 24),
            EduButton(
              label: 'Reset Password',
              onPressed: () => context.go('/login'),
            ),
          ],
        ),
      ),
    );
  }
}
