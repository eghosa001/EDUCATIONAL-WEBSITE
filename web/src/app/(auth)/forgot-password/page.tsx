'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, CheckCircleIcon } from 'lucide-react';
import { forgotPassword } from '@/services/api/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300">
          <ArrowLeftIcon className="h-4 w-4" /> Back to login
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-brand-sm dark:border-slate-800 dark:bg-slate-900">
          {submitted ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-950 dark:text-white">Check your email</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">We&apos;ve sent a password reset link to {email}</p>
              <Link href="/login" className="mt-6 inline-block text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">Back to login</Link>
            </div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <Link href="/" aria-label="THE GUIDE home">
                  <img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="mx-auto mb-4 h-16 w-16 rounded-[28%] shadow-brand-sm" />
                </Link>
                <h1 className="mb-1 text-xl font-bold text-slate-950 dark:text-white">Forgot password?</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950" placeholder="you@example.com" required />
                </div>
                <button type="submit" disabled={loading} className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white shadow-brand-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
