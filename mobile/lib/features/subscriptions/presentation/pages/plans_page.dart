import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class PlansPage extends StatelessWidget {
  const PlansPage({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Choose a Plan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _PlanCard(
              name: 'Free',
              price: 0,
              period: 'forever',
              features: ['Access to free courses', 'Basic quizzes', 'Community forums'],
              isPopular: false,
              onPress: () {},
            ),
            const SizedBox(height: 12),
            _PlanCard(
              name: 'Student Premium',
              price: 5000,
              period: 'month',
              features: ['All courses', 'Unlimited quizzes', 'AI tutor access', 'Downloadable notes', 'Certificates', 'Priority support'],
              isPopular: true,
              onPress: () => context.push('/subscribe'),
            ),
            const SizedBox(height: 12),
            _PlanCard(
              name: 'Parent',
              price: 8000,
              period: 'month',
              features: ['Monitor 3 children', 'Progress reports', 'Performance analytics', 'All Premium features'],
              isPopular: false,
              onPress: () {},
            ),
            const SizedBox(height: 24),
            const _GuaranteeBadge(),
          ],
        ),
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String name;
  final int price;
  final String period;
  final List<String> features;
  final bool isPopular;
  final VoidCallback onPress;

  const _PlanCard({
    required this.name,
    required this.price,
    required this.period,
    required this.features,
    required this.isPopular,
    required this.onPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      decoration: BoxDecoration(
        border: isPopular ? Border.all(color: theme.colorScheme.primary, width: 2) : null,
        borderRadius: BorderRadius.circular(16),
      ),
      child: EduCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (isPopular)
              Container(
                alignment: Alignment.center,
                child: const Text(
                  'MOST POPULAR',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                decoration: const BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
                ),
              ),
            if (isPopular) const SizedBox(height: 8),
            Text(name, style: theme.textTheme.titleLarge),
            const SizedBox(height: 4),
            Row(
              children: [
                Text('₦${price.toString()}', style: theme.textTheme.headlineMedium),
                if (period != 'forever') Text('/$period', style: theme.textTheme.bodyMedium),
              ],
            ),
            const Divider(height: 24),
            ...features.map((f) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  const Icon(Icons.check, size: 18, color: Colors.green),
                  const SizedBox(width: 8),
                  Text(f, style: theme.textTheme.bodyMedium),
                ],
              ),
            )),
            const SizedBox(height: 16),
            EduButton(
              label: isPopular ? 'Get Started' : 'Choose Plan',
              onPressed: onPress,
              isOutlined: !isPopular,
              textColor: theme.colorScheme.primary,
            ),
          ],
        ),
      ),
    );
  }
}

class _GuaranteeBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.success.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.security, color: Colors.green),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Money-back Guarantee', style: theme.textTheme.titleSmall),
                Text('30-day full refund if not satisfied', style: theme.textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
