'use client';

import PageHeader from '@/components/ui/PageHeader';
import ReportsManager from '@/features/reports/ReportsManager';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and export platform analytics" />
      <ReportsManager />
    </div>
  );
}
