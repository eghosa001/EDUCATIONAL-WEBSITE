'use client';

import { useState } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import UsersTable from '@/features/users/UsersTable';

export default function UsersPage() {
  const [tab, setTab] = useState('all');

  const tabs = [
    { key: 'all', label: 'All Users' },
    { key: 'student', label: 'Students' },
    { key: 'parent', label: 'Parents' },
    { key: 'teacher', label: 'Teachers' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Users" subtitle="Manage all platform users" />
      <Tabs
        tabs={tabs}
        active={tab}
        onChange={(key) => setTab(key)}
      />
      <UsersTable roleFilter={tab === 'all' ? 'all' : (tab as 'student' | 'parent' | 'teacher')} />
    </div>
  );
}
