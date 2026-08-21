'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EyeIcon, EyeOff as EyeSlashIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'student' as 'student' | 'teacher' | 'parent' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (isAuthenticated) router.push('/dashboard'); }, [isAuthenticated, router]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (formData.password.length < 8) return setError('Password must be at least 8 characters');
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) return setError('Password must contain a lowercase letter, an uppercase letter, and a digit');
    setSubmitting(true);
    try { await registerUser({ email: formData.email, password: formData.password, firstName: formData.firstName, lastName: formData.lastName, role: formData.role }); router.push('/dashboard'); }
    catch (err: any) { setError(err?.message || 'Registration failed'); }
    finally { setSubmitting(false); }
  };
  const field = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-brand-950';
  return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950"><div className="w-full max-w-md"><div className="mb-8 text-center"><Link href="/" aria-label="THE GUIDE home"><img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="mx-auto mb-4 h-24 w-24 rounded-[28%] shadow-brand-sm" /></Link><h1 className="text-2xl font-bold text-slate-950 dark:text-white">Create account</h1><p className="mt-1 text-slate-500 dark:text-slate-400">Start your learning journey</p></div><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-brand-sm dark:border-slate-800 dark:bg-slate-900">{error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}<form onSubmit={handleSubmit} className="space-y-4"><div className="grid grid-cols-2 gap-3"><div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">First name</label><input name="firstName" value={formData.firstName} onChange={handleChange} required className={field} placeholder="John" /></div><div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Last name</label><input name="lastName" value={formData.lastName} onChange={handleChange} required className={field} placeholder="Doe" /></div></div><div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label><input type="email" name="email" value={formData.email} onChange={handleChange} required className={field} placeholder="you@example.com" /></div><div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">I am a</label><select name="role" value={formData.role} onChange={handleChange} className={field}><option value="student">Student</option><option value="parent">Parent</option><option value="teacher">Teacher</option></select></div><div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label><div className="relative"><input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required minLength={8} className={`${field} pr-10`} placeholder="••••••••" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-300" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}</button></div></div><div><label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Confirm password</label><input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={field} placeholder="••••••••" /></div><button type="submit" disabled={submitting} className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white shadow-brand-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Creating account...' : 'Create account'}</button></form><div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">Already have an account? <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-300">Sign in</Link></div></div></div></div>;
}
