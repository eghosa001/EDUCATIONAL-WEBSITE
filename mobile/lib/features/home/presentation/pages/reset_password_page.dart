import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../shared/widgets/index.dart';
import 'forgot_password_page.dart';

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

class OTPVerificationPage extends StatelessWidget {
  const OTPVerificationPage({super.key});

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
            const _OTPInputField(),
            const SizedBox(height: 16),
            EduButton(
              label: 'Verify',
              onPressed: () {},
            ),
            const SizedBox(height: 16),
            Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text("Didn't receive the code? "),
                  TextButton(
                    onPressed: () {},
                    child: const Text('Resend'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OTPInputField extends StatefulWidget {
  const _OTPInputField();

  @override
  State<_OTPInputField> createState() => _OTPInputFieldState();
}

class _OTPInputFieldState extends State<_OTPInputField> {
  final List<TextEditingController> _controllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  @override
  void dispose() {
    for (var c in _controllers) c.dispose();
    for (var f in _focusNodes) f.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
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
                // Auto-submit
              }
            },
          ),
        );
      }),
    );
  }
}
