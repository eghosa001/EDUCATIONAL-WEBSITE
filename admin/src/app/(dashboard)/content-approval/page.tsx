'use client';

import PageHeader from '@/components/ui/PageHeader';
import ContentApprovalQueue from '@/features/content-approval/ContentApprovalQueue';

export default function ContentApprovalPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Content Approval" subtitle="Review courses and lessons submitted for publication" />
      <ContentApprovalQueue />
    </div>
  );
}
