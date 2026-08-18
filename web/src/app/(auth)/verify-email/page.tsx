'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyEmail } from '@/services/api/authService';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('id');
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!userId || !token) {
      setStatus('error');
      return;
    }

    verifyEmail(userId, token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [userId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div>
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Verifying your email...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Email verified!</h2>
            <p className="text-gray-500 text-sm mb-6">Your email has been successfully verified.</p>
            <button onClick={() => router.push('/dashboard')} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              Go to Dashboard
            </button>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verification failed</h2>
            <p className="text-gray-500 text-sm mb-6">This verification link is invalid or has expired.</p>
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">Back to login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
