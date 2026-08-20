'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <img src="/logos/primary-logo.jfif" alt="THE GUIDE" className="w-16 h-16 rounded-xl object-cover mx-auto mb-4 animate-pulse" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
