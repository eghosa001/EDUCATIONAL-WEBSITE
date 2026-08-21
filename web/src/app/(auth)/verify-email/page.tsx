'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon, XCircleIcon } from 'lucide-react';
import { verifyEmail } from '@/services/api/authService';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || searchParams.get('token_hash');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    verifyEmail(undefined, token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md text-center">
        {status === 'loading' && (
          <div>
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 dark:border-brand-950 dark:border-t-brand-300" />
            <p className="text-slate-500 dark:text-slate-400">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
              <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-950 dark:text-white">Email verified!</h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Your email has been successfully verified.</p>
            <button onClick={() => router.push('/dashboard')} className="rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-700">Go to Dashboard</button>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
              <XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-950 dark:text-white">Verification failed</h2>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">This verification link is invalid or has expired.</p>
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">Back to login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
