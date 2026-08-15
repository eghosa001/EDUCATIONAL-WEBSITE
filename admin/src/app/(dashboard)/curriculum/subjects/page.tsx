'use client';

import PageHeader from '@/components/ui/PageHeader';
import SubjectsManager from '@/features/curriculum/SubjectsManager';

export default function CurriculumSubjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Subjects" subtitle="Manage curriculum subjects" />
      <SubjectsManager />
    </div>
  );
}
