'use client';

import PageHeader from '@/components/ui/PageHeader';
import LevelsManager from '@/features/curriculum/LevelsManager';

export default function CurriculumLevelsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Education Levels" subtitle="Manage education systems and levels" />
      <LevelsManager />
    </div>
  );
}
