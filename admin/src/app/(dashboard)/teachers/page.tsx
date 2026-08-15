'use client';

import PageHeader from '@/components/ui/PageHeader';
import TeachersTable from '@/features/teachers/TeachersTable';

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Teachers" subtitle="Manage teachers, verification and profiles" />
      <TeachersTable />
    </div>
  );
}
