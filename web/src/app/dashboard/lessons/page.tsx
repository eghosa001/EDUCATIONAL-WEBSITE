'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LessonsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/courses');
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">Opening your courses...</p>
        <Link href="/dashboard/courses" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">
          Continue to courses
        </Link>
      </div>
    </div>
  );
}
