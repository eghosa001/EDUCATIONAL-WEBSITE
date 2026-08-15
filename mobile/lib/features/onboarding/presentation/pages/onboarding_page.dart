import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class OnboardingPage extends StatefulWidget {
  const OnboardingPage({super.key});

  @override
  State<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends State<OnboardingPage> {
  final PageController _controller = PageController();
  int _currentPage = 0;

  final List<_OnboardingSlide> _slides = [
    _OnboardingSlide(
      icon: Icons.school,
      title: 'Learn Anything, Anywhere',
      description: 'Access thousands of courses from primary school to university and professional development.',
      color: Color(0xFF1D4ED8),
    ),
    _OnboardingSlide(
      icon: Icons.video_library,
      title: 'Watch & Learn',
      description: 'High-quality video lessons, interactive quizzes, and downloadable study materials.',
      color: Color(0xFF7C3AED),
    ),
    _OnboardingSlide(
      icon: Icons.emoji_events,
      title: 'Track Your Progress',
      description: 'Monitor your learning journey with detailed analytics and personalized recommendations.',
      color: Color(0xFF059669),
    ),
    _OnboardingSlide(
      icon: Icons.psychology,
      title: 'AI-Powered Tutor',
      description: 'Get instant help with your questions from our intelligent AI tutor.',
      color: Color(0xFFD97706),
    ),
  ];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text('Skip'),
                ),
              ),
            ),

            // Page view
            Expanded(
              child: PageView.builder(
                controller: _controller,
                onPageChanged: (index) => setState(() => _currentPage = index),
                itemCount: _slides.length,
                itemBuilder: (context, index) => _SlideWidget(slide: _slides[index]),
              ),
            ),

            // Dots indicator
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _slides.length,
                (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentPage == index ? 24 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _currentPage == index ? theme.colorScheme.primary : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 32),

            // Get started button
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: EduButton(
                label: _currentPage == _slides.length - 1 ? 'Get Started' : 'Next',
                onPressed: () {
                  if (_currentPage < _slides.length - 1) {
                    _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
                  } else {
                    context.go('/login');
                  }
                },
              ),
            ),

            const SizedBox(height: 16),

            // Sign in link
            TextButton(
              onPressed: () => context.go('/login'),
              child: const Text('Already have an account? Sign in'),
            ),

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _OnboardingSlide {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  const _OnboardingSlide({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });
}

class _SlideWidget extends StatelessWidget {
  final _OnboardingSlide slide;

  const _SlideWidget({required this.slide});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: slide.color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(slide.icon, size: 64, color: slide.color),
          ),
          const SizedBox(height: 32),
          Text(
            slide.title,
            style: theme.textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            slide.description,
            style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
