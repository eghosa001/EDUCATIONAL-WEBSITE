import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/authentication_repository.dart';

class ResetPasswordPage extends ConsumerStatefulWidget {
  final String? token;

  const ResetPasswordPage({super.key, this.token});

  @override
  ConsumerState<ResetPasswordPage> createState() => _ResetPasswordPageState();
}

class _ResetPasswordPageState extends ConsumerState<ResetPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  String? _error;
  bool _reset = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    final token = widget.token;
    if (token == null || token.isEmpty) {
      setState(() => _error = 'Invalid or missing reset token');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authenticationRepositoryProvider).resetPassword(
        token: token,
        password: _passwordController.text,
      );
      if (mounted) {
        setState(() {
          _isLoading = false;
          _reset = true;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString().contains('Exception')
              ? e.toString().replaceFirst('Exception: ', '')
              : 'Failed to reset password. The link may have expired.';
        });
      }
    }
  }

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
              _reset ? 'Password reset successful' : 'Create new password',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              _reset
                  ? 'Your password has been reset successfully. You can now sign in with your new password.'
                  : 'Your new password must be different from previously used passwords.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            if (_reset) ...[
              EduButton(
                label: 'Go to Login',
                onPressed: () => context.go('/login'),
              ),
            ] else ...[
              Form(
                key: _formKey,
                child: Column(
                  children: [
                    EduTextFormField(
                      labelText: 'New Password',
                      hintText: 'Enter new password',
                      prefixIcon: Icons.lock,
                      obscureText: true,
                      validator: (v) => v == null || v.length < 8 ? 'Password must be 8+ characters' : null,
                      initialValue: _passwordController.text,
                      onChanged: (v) => _passwordController.text = v,
                    ),
                    const SizedBox(height: 16),
                    EduTextFormField(
                      labelText: 'Confirm Password',
                      hintText: 'Confirm new password',
                      prefixIcon: Icons.lock_outline,
                      obscureText: true,
                      validator: (v) {
                        if (v == null || v.isEmpty) return 'Please confirm your password';
                        if (v != _passwordController.text) return 'Passwords do not match';
                        return null;
                      },
                      initialValue: _confirmPasswordController.text,
                      onChanged: (v) => _confirmPasswordController.text = v,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(_error!, style: TextStyle(color: theme.colorScheme.error)),
                ),
              EduButton(
                label: 'Reset Password',
                isLoading: _isLoading,
                onPressed: _resetPassword,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class OTPVerificationPage extends ConsumerStatefulWidget {
  const OTPVerificationPage({super.key});

  @override
  ConsumerState<OTPVerificationPage> createState() => _OTPVerificationPageState();
}

class _OTPVerificationPageState extends ConsumerState<OTPVerificationPage> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());
  bool _isLoading = false;
  String? _error;
  String? _email;

  @override
  void initState() {
    super.initState();
    _email = ref.read(userProvider)?['email'] as String?;
  }

  @override
  void dispose() {
    for (var c in _controllers) c.dispose();
    for (var f in _focusNodes) f.dispose();
    super.dispose();
  }

  String get _otpCode => _controllers.map((c) => c.text).join();

  Future<void> _verify() async {
    final code = _otpCode;
    if (code.length != 6) {
      setState(() => _error = 'Please enter the complete 6-digit code');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await ref.read(authenticationRepositoryProvider).verifyEmail(token: code);
      if (mounted) {
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString().contains('Exception')
              ? e.toString().replaceFirst('Exception: ', '')
              : 'Verification failed. Please try again.';
        });
      }
    }
  }

  Future<void> _resend() async {
    if (_email == null) return;
    try {
      await ref.read(authenticationRepositoryProvider).forgotPassword(email: _email!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Verification email resent')),
        );
      }
    } catch (_) {}
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
            Icon(Icons.mail, size: 64, color: theme.colorScheme.primary),
            const SizedBox(height: 16),
            Text(
              'Verify your email',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'We\'ve sent a 6-digit code to your email address.',
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(6, (index) {
                return SizedBox(
                  width: 40,
                  child: TextField(
                    controller: _controllers[index],
                    focusNode: _focusNodes[index],
                    textAlign: TextAlign.center,
                    maxLength: 1,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(counterText: ''),
                    onChanged: (value) {
                      if (value.isNotEmpty && index < 5) {
                        _focusNodes[index + 1].requestFocus();
                      }
                      if (value.isNotEmpty && index == 5) {
                        _verify();
                      }
                    },
                  ),
                );
              }),
            ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(_error!, style: TextStyle(color: theme.colorScheme.error, fontSize: 14)),
              ),
            const SizedBox(height: 24),
            EduButton(
              label: 'Verify',
              isLoading: _isLoading,
              onPressed: _verify,
            ),
            const SizedBox(height: 16),
            Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Didn't receive the code? "),
                  TextButton(
                    onPressed: _resend,
                    child: const Text('Resend'),
                  ),
                ],
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
