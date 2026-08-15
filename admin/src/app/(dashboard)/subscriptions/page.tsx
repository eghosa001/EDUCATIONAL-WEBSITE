'use client';

import PageHeader from '@/components/ui/PageHeader';
import SubscriptionsManager from '@/features/subscriptions/SubscriptionsManager';

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Subscriptions" subtitle="Manage subscription plans and monitor adoption" />
      <SubscriptionsManager />
    </div>
  );
}
