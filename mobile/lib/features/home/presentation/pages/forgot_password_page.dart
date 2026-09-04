import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/authentication_repository.dart';

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendResetLink() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email)) {
      setState(() => _error = 'Please enter a valid email');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authenticationRepositoryProvider).forgotPassword(email: email);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _sent = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString().contains('Exception')
              ? e.toString().replaceFirst('Exception: ', '')
              : 'Failed to send reset link. Please try again.';
        });
      }
    }
  }

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
              _sent ? 'Check your email' : 'Reset your password',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _sent
                  ? 'We\'ve sent a password reset link to ${_emailController.text}. Please check your inbox.'
                  : 'Enter your email address and we\'ll send you a link to reset your password.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            if (!_sent) ...[
              EduTextFormField(
                labelText: 'Email',
                hintText: 'Enter your email',
                prefixIcon: Icons.email,
                keyboardType: TextInputType.emailAddress,
                initialValue: _emailController.text,
                onChanged: (v) => _emailController.text = v,
              ),
              const SizedBox(height: 24),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
                ),
              EduButton(
                label: 'Send Reset Link',
                isLoading: _isLoading,
                onPressed: _sendResetLink,
              ),
            ] else ...[
              EduButton(
                label: 'Open Email App',
                onPressed: () {},
              ),
              const SizedBox(height: 12),
              EduButton(
                label: 'Resend Email',
                isOutlined: true,
                onPressed: _sendResetLink,
                textColor: theme.colorScheme.primary,
              ),
            ],
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
