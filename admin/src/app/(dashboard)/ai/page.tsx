'use client';

import PageHeader from '@/components/ui/PageHeader';
import AiUsageManager from '@/features/ai/AiUsageManager';

export default function AiPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="AI Management" subtitle="Monitor AI tutor usage and model costs" />
      <AiUsageManager />
    </div>
  );
}
