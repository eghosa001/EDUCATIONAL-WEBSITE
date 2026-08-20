'use client';

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import UsersTable from '@/features/users/UsersTable';

export default function TeachersListingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <UsersTable roleFilter="teacher" />
    </Suspense>
  );
}
