'use client';

import PageHeader from '@/components/ui/PageHeader';
import PaymentsManager from '@/features/payments/PaymentsManager';

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Payments" subtitle="Monitor transactions and process refunds" />
      <PaymentsManager />
    </div>
  );
}
