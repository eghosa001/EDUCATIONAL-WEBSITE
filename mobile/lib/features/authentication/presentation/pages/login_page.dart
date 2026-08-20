import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/blocs/index.dart';
import '../../../core/utils/validators.dart';

class LoginPage extends ConsumerWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final emailController = TextEditingController();
    final passwordController = TextEditingController();

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              // Logo
              Center(
                child: Column(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Image.asset(
                        'assets/images/logos/primary-logo.jfif',
                        width: 80,
                        height: 80,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'THE GUIDE',
                      style: theme.textTheme.headlineMedium?.copyWith(color: theme.colorScheme.primary),
                    ),
                    Text(
                      'Your path to smarter learning',
                      style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // Email field
              EduTextFormField(
                labelText: 'Email',
                hintText: 'Enter your email',
                prefixIcon: Icons.email,
                keyboardType: TextInputType.emailAddress,
                validator: StringValidators.emailValidator,
                initialValue: emailController.text,
                onChanged: (v) => emailController.text = v,
              ),
              const SizedBox(height: 16),

              // Password field
              EduTextFormField(
                labelText: 'Password',
                hintText: 'Enter your password',
                prefixIcon: Icons.lock,
                obscureText: true,
                suffixIcon: Icons.visibility,
                onSuffixIconPressed: () {},
                validator: StringValidators.passwordValidator,
                initialValue: passwordController.text,
                onChanged: (v) => passwordController.text = v,
              ),
              const SizedBox(height: 8),

              // Forgot password
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () => context.push('/forgot-password'),
                  child: const Text('Forgot Password?'),
                ),
              ),
              const SizedBox(height: 24),

              // Login button
              EduButton(
                label: 'Sign In',
                onPressed: () async {
                  final email = emailController.text.trim();
                  final password = passwordController.text;
                  if (StringValidators.isValidEmail(email) && StringValidators.isValidPassword(password)) {
                    await ref.read(authNotifierProvider.notifier).login(email: email, password: password);
                    final state = ref.read(authNotifierProvider);
                    if (state.isAuthenticated) {
                      context.go('/home');
                    }
                  }
                },
              ),
              const SizedBox(height: 24),

              // Register link
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Don't have an account? "),
                    TextButton(
                      onPressed: () => context.push('/register'),
                      child: const Text('Sign Up'),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Social login
              const Row(
                children: [
                  Expanded(child: Divider()),
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('OR', style: TextStyle(color: Colors.grey)),
                  ),
                  Expanded(child: Divider()),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _SocialButton(icon: Icons.apple, label: 'Apple', onTap: () {}),
                  _SocialButton(icon: Icons.g_mobiledata, label: 'Google', onTap: () {}),
                  _SocialButton(icon: Icons.facebook, label: 'Facebook', onTap: () {}),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SocialButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return EduCard(
      onTap: onTap,
      child: Column(
        children: [
          Icon(icon, size: 28),
          const SizedBox(height: 4),
          Text(label, style: Theme.of(context).textTheme.labelSmall),
        ],
      ),
    );
  }
}
