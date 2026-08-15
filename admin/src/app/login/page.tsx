'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, EyeIcon, EyeOff } from 'lucide-react';
import { useAdminAuthStore, hydrateAdminAuth } from '@/state/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, login } = useAdminAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    hydrateAdminAuth();
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo credentials check
      if (email === 'admin@eduplatform.ng' && password === 'admin123') {
        login(
          {
            id: '1',
            email,
            firstName: 'Super',
            lastName: 'Admin',
            role: 'super_admin',
            roles: ['super_admin'],
          },
          'demo-token'
        );
        router.push('/dashboard');
      } else {
        setError('Invalid credentials. Use admin@eduplatform.ng / admin123');
      }
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-500 mt-1">Sign in to manage the platform</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="admin@eduplatform.ng"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-10"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
            <p className="text-xs text-indigo-700 font-medium mb-1">Demo Credentials:</p>
            <p className="text-xs text-indigo-600">admin@eduplatform.ng</p>
            <p className="text-xs text-indigo-600">admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
