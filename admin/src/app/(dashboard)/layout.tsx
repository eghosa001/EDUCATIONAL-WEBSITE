'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore, hydrateAdminAuth } from '@/state/auth';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, hydrated, user, logout } = useAdminAuthStore();
  useEffect(() => { hydrateAdminAuth(); }, []);
  useEffect(() => { if (hydrated && !isAuthenticated) router.push('/login'); }, [hydrated, isAuthenticated, router]);
  if (!hydrated || !isAuthenticated) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" /><p className="text-gray-500">Loading...</p></div></div>;

  const items = [
    ['Dashboard','/dashboard'],['Users','/dashboard/users'],['Teachers','/dashboard/teachers'],['Schools','/dashboard/schools'],['Curriculum','/dashboard/curriculum/subjects'],['Courses','/dashboard/courses'],['Lessons','/dashboard/lessons'],['Questions','/dashboard/questions'],['Exams','/dashboard/exams'],['Library','/dashboard/library'],['AI','/dashboard/ai'],['Content Approval','/dashboard/content-approval'],['Moderation','/dashboard/moderation'],['Payments','/dashboard/payments'],['Subscriptions','/dashboard/subscriptions'],['Reports','/dashboard/reports'],['Notifications','/dashboard/notifications'],['Settings','/dashboard/settings'],
  ];
  return <div className="min-h-screen bg-gray-50">
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between"><div className="flex items-center gap-3"><img src="/logos/the-guide-mark.webp" alt="THE GUIDE" className="w-10 h-10 rounded-[28%] shadow-sm" /><span className="font-extrabold text-gray-900">THE GUIDE Admin</span></div><div className="flex items-center gap-4"><span className="text-sm text-gray-500">{user?.firstName} {user?.lastName}</span><button onClick={() => { logout(); window.location.href = '/login'; }} className="text-sm text-red-600 hover:text-red-700 font-medium">Logout</button></div></header>
    <div className="flex"><aside className="w-56 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] p-3"><nav className="space-y-1">{items.map(([label,href]) => <a key={href} href={href} className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900">{label}</a>)}</nav></aside><main className="flex-1 p-6">{children}</main></div>
  </div>;
}
