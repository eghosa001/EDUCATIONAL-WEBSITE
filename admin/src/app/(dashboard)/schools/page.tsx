'use client';

import PageHeader from '@/components/ui/PageHeader';
import SchoolsTable from '@/features/schools/SchoolsTable';

export default function SchoolsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Schools" subtitle="Onboard, verify and manage schools" />
      <SchoolsTable />
    </div>
  );
}
