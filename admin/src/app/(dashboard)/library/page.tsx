'use client';

import PageHeader from '@/components/ui/PageHeader';
import LibraryManager from '@/features/library/LibraryManager';

export default function LibraryAdminPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Library" subtitle="Manage digital resources: textbooks, notes, PDFs and videos" />
      <LibraryManager />
    </div>
  );
}
