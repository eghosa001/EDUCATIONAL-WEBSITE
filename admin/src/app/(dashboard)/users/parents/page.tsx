'use client';

import PageHeader from '@/components/ui/PageHeader';
import UsersTable from '@/features/users/UsersTable';

export default function ParentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Parents" subtitle="All parent accounts" />
      <UsersTable roleFilter="parent" />
    </div>
  );
}
