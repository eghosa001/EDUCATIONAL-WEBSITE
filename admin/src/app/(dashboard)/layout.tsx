'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore, hydrateAdminAuth } from '@/state/auth';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hydrated, user, logout } = useAdminAuthStore();

  useEffect(() => {
    hydrateAdminAuth();
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <img src="/logos/primary-logo.jfif" alt="THE GUIDE" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-bold text-gray-900">THE GUIDE Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.firstName} {user?.lastName}</span>
          <button onClick={() => { logout(); window.location.href = '/login'; }}
            className="text-sm text-red-600 hover:text-red-700 font-medium">
            Logout
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-3.5rem)] p-3">
          <nav className="space-y-1">
            {[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Users', href: '/dashboard/users' },
              { label: 'Teachers', href: '/dashboard/teachers' },
              { label: 'Schools', href: '/dashboard/schools' },
              { label: 'Curriculum', href: '/dashboard/curriculum/subjects' },
              { label: 'Courses', href: '/dashboard/courses' },
              { label: 'Lessons', href: '/dashboard/lessons' },
              { label: 'Questions', href: '/dashboard/questions' },
              { label: 'Exams', href: '/dashboard/exams' },
              { label: 'Library', href: '/dashboard/library' },
              { label: 'AI', href: '/dashboard/ai' },
              { label: 'Content Approval', href: '/dashboard/content-approval' },
              { label: 'Moderation', href: '/dashboard/moderation' },
              { label: 'Payments', href: '/dashboard/payments' },
              { label: 'Subscriptions', href: '/dashboard/subscriptions' },
              { label: 'Reports', href: '/dashboard/reports' },
              { label: 'Notifications', href: '/dashboard/notifications' },
              { label: 'Settings', href: '/dashboard/settings' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
