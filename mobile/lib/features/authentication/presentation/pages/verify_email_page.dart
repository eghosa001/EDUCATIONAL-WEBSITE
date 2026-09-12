import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/authentication_repository.dart';
import '../../../shared/blocs/index.dart';

class VerifyEmailPage extends ConsumerStatefulWidget {
  const VerifyEmailPage({super.key});

  @override
  ConsumerState<VerifyEmailPage> createState() => _VerifyEmailPageState();
}

class _VerifyEmailPageState extends ConsumerState<VerifyEmailPage> {
  bool _isLoading = false;
  String? _error;
  String? _success;

  String? get _userEmail => ref.read(authNotifierProvider).pendingEmail;

  Future<void> _resendEmail() async {
    final email = _userEmail;
    if (email == null || email.isEmpty) {
      setState(() => _error = 'Your pending email address is unavailable. Please register again.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
      _success = null;
    });

    try {
      await ref.read(authenticationRepositoryProvider).resendVerification(email: email);
      if (mounted) {
        setState(() {
          _isLoading = false;
          _success = 'A new verification email has been sent.';
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Failed to resend the verification email. Please try again.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final email = ref.watch(authNotifierProvider).pendingEmail;

    return Scaffold(
      appBar: AppBar(title: const Text('Verify Email')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.mail_outline, size: 64, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text('Check your email', style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              'We sent a verification link${email != null ? ' to $email' : ''}. Open that link to verify your account, then return here and sign in.',
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
            if (_success != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Text(_success!, style: TextStyle(color: theme.colorScheme.primary)),
              ),
            Center(
              child: TextButton(
                onPressed: _isLoading ? null : _resendEmail,
                child: Text(_isLoading ? 'Sending...' : 'Resend verification email'),
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
