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
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try { await login({ email, password }); router.push('/dashboard'); }
    catch (err: any) { setError(err?.message || 'Invalid email or password'); }
    finally { setSubmitting(false); }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logos/the-guide-mark.webp" alt="THE GUIDE" className="w-24 h-24 mx-auto mb-4 rounded-[28%] shadow-sm" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your learning journey</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" placeholder="you@example.com" required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10" placeholder="••••••••" required minLength={6} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button></div></div>
            <div className="flex items-center justify-between"><label className="flex items-center gap-2"><input type="checkbox" className="rounded border-gray-300 text-blue-600" /><span className="text-sm text-gray-600">Remember me</span></label><Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">Forgot password?</Link></div>
            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">{submitting ? 'Signing in...' : 'Sign in'}</button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">Don&apos;t have an account? <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">Sign up</Link></div>
        </div>
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4"><p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials</p><div className="space-y-1 text-xs"><p className="text-blue-600"><span className="font-medium">Admin:</span> admin@learnforge.ng / Admin@12345</p><p className="text-blue-600"><span className="font-medium">Teacher:</span> teacher@learnforge.ng / Teacher@12345</p><p className="text-blue-600"><span className="font-medium">Student:</span> student@learnforge.ng / Student@12345</p></div></div>
      </div>
    </div>
  );
}
