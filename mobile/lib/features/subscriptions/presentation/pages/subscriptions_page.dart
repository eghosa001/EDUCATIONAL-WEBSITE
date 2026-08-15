import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../shared/widgets/index.dart';

class SubscriptionsPage extends StatelessWidget {
  const SubscriptionsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Subscriptions')),
      body: const _SubscriptionBody(),
    );
  }
}

class _SubscriptionBody extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Current plan
          _CurrentPlanCard(),
          const SizedBox(height: 24),

          // Available plans
          Text('Choose a Plan', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          _PlanCard(
            name: 'Student Basic',
            price: 0,
            period: 'forever',
            features: ['Access to free courses', 'Basic quizzes', 'Community access'],
            isCurrent: false,
            onPress: () {},
          ),
          const SizedBox(height: 12),
          _PlanCard(
            name: 'Student Premium',
            price: 5000,
            period: 'month',
            features: ['All courses', 'Unlimited quizzes', 'AI tutor access', 'Downloadable notes', 'Certificates'],
            isCurrent: true,
            onPress: () {},
          ),
          const SizedBox(height: 12),
          _PlanCard(
            name: 'Parent',
            price: 8000,
            period: 'month',
            features: ['Monitor up to 3 children', 'Progress reports', 'Performance analytics', 'All Premium features'],
            isCurrent: false,
            onPress: () {},
          ),
          const SizedBox(height: 12),
          _PlanCard(
            name: 'Teacher',
            price: 10000,
            period: 'month',
            features: ['Create unlimited courses', 'Student management', 'Analytics dashboard', 'Earning tools'],
            isCurrent: false,
            onPress: () {},
          ),
        ],
      ),
    );
  }
}

class _CurrentPlanCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.workspace_premium, color: theme.colorScheme.warning, size: 32),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Current Plan', style: theme.textTheme.labelMedium),
                    Text('Student Premium', style: theme.textTheme.titleLarge),
                  ],
                ),
              ),
              EduBadge(
                label: 'Active',
                backgroundColor: theme.colorScheme.success,
                textColor: Colors.white,
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _PlanStat(label: 'Renews', value: 'Dec 31'),
              _PlanStat(label: 'Next billing', value: '₦5,000'),
              _PlanStat(label: 'Days left', value: '15'),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: EduButton(
                  label: 'Manage Subscription',
                  isOutlined: true,
                  textColor: theme.colorScheme.primary,
                  onPressed: () {},
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: EduButton(
                  label: 'Cancel',
                  isOutlined: true,
                  color: theme.colorScheme.error,
                  textColor: theme.colorScheme.error,
                  onPressed: () {},
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PlanStat extends StatelessWidget {
  final String label;
  final String value;

  const _PlanStat({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: Theme.of(context).textTheme.titleMedium),
        Text(label, style: Theme.of(context).textTheme.labelSmall),
      ],
    );
  }
}

class _PlanCard extends StatelessWidget {
  final String name;
  final int price;
  final String period;
  final List<String> features;
  final bool isCurrent;
  final VoidCallback onPress;

  const _PlanCard({
    required this.name,
    required this.price,
    required this.period,
    required this.features,
    required this.isCurrent,
    required this.onPress,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return EduCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(name, style: theme.textTheme.titleMedium),
              const Spacer(),
              if (isCurrent)
                EduBadge(label: 'Current', backgroundColor: theme.colorScheme.success, textColor: Colors.white),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Text('₦${price.toString()}', style: theme.textTheme.headlineSmall),
              if (period != 'forever') Text('/$period', style: theme.textTheme.bodyMedium),
            ],
          ),
          const SizedBox(height: 12),
          ...features.map((feature) => Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Row(
              children: [
                Icon(Icons.check, size: 16, color: theme.colorScheme.success),
                const SizedBox(width: 8),
                Text(feature, style: theme.textTheme.bodyMedium),
              ],
            ),
          )),
          const SizedBox(height: 12),
          if (!isCurrent)
            EduButton(label: 'Upgrade', onPressed: onPress),
        ],
      ),
    );
  }
}
