'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeOff as EyeSlashIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (isAuthenticated) router.push('/dashboard'); }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSubmitting(true);
    try { await login({ email, password }); router.push('/dashboard'); }
    catch (err: any) { setError(err?.message || 'Invalid email or password'); }
    finally { setSubmitting(false); }
  };

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-[#151A3A]"><div className="h-9 w-9 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600 dark:border-brand-950 dark:border-t-brand-300" aria-label="Loading" /></div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10 dark:bg-[#151A3A]">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" aria-label="THE GUIDE home"><img src="/logos/the-guide-mark.webp" alt="THE GUIDE" className="mx-auto mb-4 h-24 w-24 rounded-[28%] object-cover shadow-brand" /></Link>
          <h1 className="text-2xl font-bold text-[#151A3A] dark:text-white">Welcome back</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Sign in to your learning journey</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-brand dark:border-slate-700 dark:bg-[#1b2045]">
          {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white dark:focus:ring-brand-950" placeholder="you@example.com" required /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white dark:focus:ring-brand-950" placeholder="••••••••" required minLength={6} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></div></div>
            <div className="flex items-center justify-between"><label className="flex items-center gap-2"><input type="checkbox" className="rounded border-stone-300 text-brand-600 focus:ring-brand-500" /><span className="text-sm text-slate-600 dark:text-slate-300">Remember me</span></label><Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300">Forgot password?</Link></div>
            <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#151A3A] py-2.5 font-semibold text-white shadow-brand-sm transition-colors hover:bg-[#202750] disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">Don&apos;t have an account? <Link href="/register" className="font-medium text-brand-700 hover:text-brand-800 dark:text-brand-300">Sign up</Link></div>
        </div>
      </div>
    </div>
  );
}
