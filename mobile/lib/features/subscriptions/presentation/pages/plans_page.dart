import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../shared/widgets/index.dart';
import '../../../shared/repositories/subscription_repository.dart';

final _plansFutureProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.read(subscriptionRepositoryProvider);
  return repo.getPlans();
});

class PlansPage extends ConsumerWidget {
  const PlansPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(_plansFutureProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Choose a Plan')),
      body: plansAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Failed to load plans', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              EduButton(label: 'Retry', onPressed: () => ref.invalidate(_plansFutureProvider)),
            ],
          ),
        ),
        data: (plans) {
          if (plans.isEmpty) {
            return const EduEmptyState(
              icon: Icons.card_membership,
              title: 'No plans available',
              subtitle: 'Check back later for subscription plans.',
            );
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                ...plans.map((plan) {
                  final isPopular = plan['isPopular'] ?? plan['is_popular'] ?? false;
                  final price = (plan['price'] as num?)?.toInt() ?? 0;
                  final name = plan['name'] ?? plan['title'] ?? 'Plan';
                  final period = plan['billingCycle'] ?? plan['billing_cycle'] ?? 'month';
                  final features = (plan['features'] as List?)?.map((f) => f.toString()).toList() ?? [];
                  final planId = plan['id']?.toString() ?? '';

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _PlanCard(
                      name: name,
                      price: price,
                      period: period.toString(),
                      features: features,
                      isPopular: isPopular,
                      onPress: () => context.push('/subscribe?planId=$planId'),
                    ),
                  );
                }),
                const SizedBox(height: 24),
                const _GuaranteeBadge(),
              ],
            ),
          );
        },
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
            if (features.isEmpty)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text('Basic access included', style: theme.textTheme.bodyMedium),
              ),
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
        color: theme.colorScheme.primaryContainer.withOpacity(0.3),
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
