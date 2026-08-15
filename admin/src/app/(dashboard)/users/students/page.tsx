'use client';

import PageHeader from '@/components/ui/PageHeader';
import UsersTable from '@/features/users/UsersTable';

export default function StudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle="All student accounts" />
      <UsersTable roleFilter="student" />
    </div>
  );
}
