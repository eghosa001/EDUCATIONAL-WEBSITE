'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeOff } from 'lucide-react';
import { useAdminAuthStore, hydrateAdminAuth } from '@/state/auth';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAdminAuthStore();
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  useEffect(() => { hydrateAdminAuth(); if (isAuthenticated) router.replace('/dashboard'); }, [isAuthenticated, router]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (authError || !data.user || !data.session) throw new Error(authError?.message || 'Invalid credentials');
      const [{ data: profile }, { data: roleRows }] = await Promise.all([supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(), supabase.from('user_roles').select('roles(name)').eq('user_id', data.user.id)]);
      const roles = (roleRows || []).map((r: any) => r.roles?.name).filter(Boolean) as string[];
      const allowed = roles.some((role) => ['super_admin', 'admin', 'content_admin'].includes(role));
      if (!allowed) { await supabase.auth.signOut(); throw new Error('Access denied. Admin account required.'); }
      login({ id: data.user.id, email: data.user.email || '', firstName: profile?.first_name || '', lastName: profile?.last_name || '', role: (roles[0] || 'admin') as any, roles: roles as any }, data.session.access_token);
      router.push('/dashboard');
    } catch (err: any) { setError(err?.message || 'Login failed. Please try again.'); } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8"><img src="/logos/the-guide-mark.webp" alt="THE GUIDE" className="w-24 h-24 mx-auto mb-4 rounded-[28%] shadow-sm" /><h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1><p className="text-gray-500 mt-1">Sign in to manage THE GUIDE</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4"><div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="admin@example.com" required /></div><div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><div className="relative"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none pr-10" placeholder="••••••••" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button></div></div><button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button></form>
        </div>
      </div>
    </div>
  );
}
