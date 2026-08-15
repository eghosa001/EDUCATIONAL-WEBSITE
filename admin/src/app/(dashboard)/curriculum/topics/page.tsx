'use client';

import PageHeader from '@/components/ui/PageHeader';
import TopicsManager from '@/features/curriculum/TopicsManager';

export default function CurriculumTopicsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Topics" subtitle="Manage topics and subtopics" />
      <TopicsManager />
    </div>
  );
}
