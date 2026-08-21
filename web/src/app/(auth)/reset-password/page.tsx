'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EyeIcon, EyeOff as EyeSlashIcon, CheckCircleIcon } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { resetPassword } from '@/services/api/authService';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabase();

    const checkRecoverySession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;
      if (sessionError || !data.session) {
        setError('This password reset link is invalid or has expired. Please request a new one.');
      } else {
        setError('');
      }
      setLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        setError('');
        setLoading(false);
      }
    });

    checkRecoverySession();

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ password });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40"><CheckCircleIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" /></div>
          <h2 className="mb-2 text-xl font-bold text-slate-950 dark:text-white">Password reset successfully</h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">Your password has been updated. You can now sign in with your new password.</p>
          <Link href="/login" className="inline-block rounded-lg bg-brand-600 px-6 py-2.5 font-medium text-white hover:bg-brand-700">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" aria-label="THE GUIDE home"><img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="mx-auto mb-4 h-20 w-20 rounded-[28%] shadow-brand-sm" /></Link>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white">Reset password</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Enter your new password below</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-brand-sm dark:border-slate-800 dark:bg-slate-900">
          {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">New password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={loading || Boolean(error)} className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white shadow-brand-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{loading ? 'Resetting...' : 'Reset password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
