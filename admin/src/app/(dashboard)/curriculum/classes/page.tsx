'use client';

import PageHeader from '@/components/ui/PageHeader';
import ClassesManager from '@/features/curriculum/ClassesManager';

export default function CurriculumClassesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Classes" subtitle="Manage classes under education programs" />
      <ClassesManager />
    </div>
  );
}
