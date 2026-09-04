import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/authentication_repository.dart';
import '../../../di/providers.dart';

class VerifyEmailPage extends ConsumerStatefulWidget {
  const VerifyEmailPage({super.key});

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _resendEmail();
  }

  String? get _userEmail {
    final user = ref.read(userProvider);
    return user?['email'] as String?;
  }

  Future<void> _resendEmail() async {
    final email = _userEmail;
    if (email == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authenticationRepositoryProvider).forgotPassword(email: email);
      if (mounted) {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to resend. Please try again.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Verify Email')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.mail_outline, size: 64, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'Check your email',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'We\'ve sent a verification link to your email address${_userEmail != null ? ' (${_userEmail!})' : ''}. Please check your inbox and click the link to verify your account.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 32),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
              ),
            EduButton(
              label: 'Open Email App',
              onPressed: () {},
            ),
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: _isLoading ? null : _resendEmail,
                child: Text(_isLoading ? 'Sending...' : 'Resend Email'),
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton(
                onPressed: () => context.go('/login'),
                child: const Text('Back to Login'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
