'use client';

import PageHeader from '@/components/ui/PageHeader';
import ModerationQueue from '@/features/moderation/ModerationQueue';

export default function ModerationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Content Moderation" subtitle="Review flagged posts and community content" />
      <ModerationQueue />
    </div>
  );
}
