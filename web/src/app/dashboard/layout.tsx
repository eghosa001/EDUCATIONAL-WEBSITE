'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import BrandLogo from '@/components/BrandLogo';
import { ThemeToggle } from '@/contexts/ThemeContext';
import { Home, BookOpen, ClipboardCheck as ClipboardDocumentCheckIcon, MessageSquare as ChatBubbleLeftRightIcon, Bookmark as LibraryBookmarkIcon, Lightbulb as LightBulbIcon, Users as UserGroupIcon, Trophy, Bell, FileText as DocumentTextIcon, LogOut as ArrowLeftStartOnRectangleIcon, Menu as Bars3Icon, X as XMarkIcon, Settings as Cog6ToothIcon, GraduationCap, Library, CreditCard } from 'lucide-react';

const studentNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'JAMB', href: '/dashboard/jamb', icon: LibraryBookmarkIcon },
  { label: 'School Exams', href: '/dashboard/exams', icon: ClipboardDocumentCheckIcon },
  { label: 'Flashcards', href: '/dashboard/flashcards', icon: BookOpen },
  { label: 'Courses', href: '/dashboard/courses', icon: BookOpen },
  { label: 'Curriculum', href: '/dashboard/curriculum', icon: GraduationCap },
  { label: 'Progress', href: '/dashboard/progress', icon: Trophy },
  { label: 'AI Tutor', href: '/dashboard/ai/tutor', icon: LightBulbIcon },
  { label: 'Library', href: '/dashboard/library', icon: Library },
  { label: 'Plans', href: '/dashboard/subscriptions/plans', icon: CreditCard },
  { label: 'Community', href: '/dashboard/community', icon: ChatBubbleLeftRightIcon },
  { label: 'Reports', href: '/dashboard/reports', icon: DocumentTextIcon },
];
const teacherNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home }, { label: 'My Courses', href: '/dashboard/courses', icon: BookOpen }, { label: 'Assignments', href: '/dashboard/assignments', icon: ClipboardDocumentCheckIcon }, { label: 'Students', href: '/dashboard/teacher', icon: UserGroupIcon }, { label: 'Earnings', href: '/dashboard/teacher', icon: Trophy }, { label: 'Reports', href: '/dashboard/teacher/report', icon: DocumentTextIcon },
];
const parentNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home }, { label: 'My Children', href: '/dashboard/parent', icon: UserGroupIcon }, { label: 'Progress', href: '/dashboard/progress', icon: Trophy }, { label: 'Results', href: '/dashboard/exams', icon: ClipboardDocumentCheckIcon }, { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];
// Prefetch only the most likely destinations. Preloading the entire dashboard
// route tree on every page competes with active lesson and CBT requests.
const likelyDestinations = {
  student: ['/dashboard/jamb', '/dashboard/courses', '/dashboard/flashcards'],
  teacher: ['/dashboard/courses', '/dashboard/assignments'],
  parent: ['/dashboard/parent', '/dashboard/progress'],
} as const;

function DashboardSessionGate() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-[#151A3A]" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" aria-hidden="true" />
        <p className="text-sm text-slate-500 dark:text-slate-300">Restoring your secure session…</p>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const navRole = user.role === 'teacher' ? 'teacher' : user.role === 'parent' ? 'parent' : 'student';
    const connection = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
    if (connection.connection?.saveData || connection.connection?.effectiveType === '2g') return;
    const prefetch = () => likelyDestinations[navRole]
      .filter(href => href !== pathname)
      .forEach(href => router.prefetch(href));
    const idleWindow = typeof window !== 'undefined' ? window as typeof window & { requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number; cancelIdleCallback?: (id: number) => void } : null;
    if (idleWindow?.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(prefetch, 250);
    return () => window.clearTimeout(id);
  }, [isAuthenticated, pathname, router, user?.id, user?.role]);

  useEffect(() => {
    setPendingHref(null);
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sidebarOpen]);

  // Never render protected dashboard content until Supabase session restoration
  // has completed and authenticated the visitor.
  if (isLoading || !isAuthenticated || !user) return <DashboardSessionGate />;

  const navItems = user.role === 'teacher' ? teacherNavItems : user.role === 'parent' ? parentNavItems : studentNavItems;
  const handleLogout = async () => { await logout(); router.replace('/login'); };
  const handleNavClick = (href: string) => { setPendingHref(href); setSidebarOpen(false); };
  const Brand = () => <BrandLogo href="/dashboard" compact className="max-w-[190px]" />;
  const showRouteProgress = Boolean(pendingHref && pendingHref !== pathname);

  return <div className="min-h-screen bg-stone-50 dark:bg-[#151A3A]">
    {showRouteProgress && <div className="fixed left-0 right-0 top-0 z-[70] h-1 overflow-hidden bg-brand-100 dark:bg-slate-800"><div className="h-full w-2/3 animate-pulse rounded-r-full bg-brand-600" /></div>}
    <header className="fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between border-b border-stone-200 bg-white px-4 dark:border-slate-700 dark:bg-[#151A3A] lg:hidden"><Brand /><div className="ml-auto flex items-center gap-1"><ThemeToggle compact /><button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={sidebarOpen} aria-controls="dashboard-sidebar">{sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}</button></div></header>
    {sidebarOpen && <div className="fixed inset-0 z-40 bg-[#151A3A]/60 backdrop-blur-[1px] lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside id="dashboard-sidebar" className={`fixed left-0 top-0 z-50 h-full w-64 transform border-r border-stone-200 bg-white transition-transform duration-200 dark:border-slate-700 dark:bg-[#151A3A] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}><div className="flex h-full flex-col"><div className="flex h-16 items-center border-b border-stone-100 px-4 dark:border-slate-700"><Brand /><button onClick={() => setSidebarOpen(false)} className="ml-auto rounded p-1 text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-slate-800 lg:hidden"><XMarkIcon className="h-5 w-5" /></button></div><nav className="flex-1 overflow-y-auto px-2 py-4"><div className="space-y-1">{navItems.map((item) => { const isActive = item.href === '/dashboard'
  ? pathname === '/dashboard'
  : pathname === item.href || pathname.startsWith(`${item.href}/`); const isPending = pendingHref === item.href && !isActive; return <Link key={item.href} href={item.href} prefetch={false} onClick={() => handleNavClick(item.href)} onMouseEnter={() => router.prefetch(item.href)} onFocus={() => router.prefetch(item.href)} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-brand-50 text-brand-800 dark:bg-brand-950/60 dark:text-brand-300' : isPending ? 'bg-stone-50 text-brand-700 dark:bg-slate-900 dark:text-brand-300' : 'text-slate-600 hover:bg-stone-50 hover:text-brand-800 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-brand-300'}`}><item.icon className="h-5 w-5 flex-shrink-0" />{item.label}{isPending && <span className="ml-auto h-2 w-2 animate-pulse rounded-full bg-brand-600" />}</Link>; })}</div></nav><div className="border-t border-stone-100 p-4 dark:border-slate-700"><div className="mb-3 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800 dark:bg-brand-950 dark:text-brand-300">{user.firstName?.[0]}{user.lastName?.[0]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p><p className="text-xs capitalize text-slate-500 dark:text-slate-400">{user.role}</p></div></div><div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-stone-200 px-2 py-2 dark:border-slate-700"><span className="text-xs font-semibold text-slate-600 dark:text-slate-200">Appearance</span><ThemeToggle /></div><Link href="/dashboard/profile/settings" prefetch={false} onMouseEnter={() => router.prefetch('/dashboard/profile/settings')} onFocus={() => router.prefetch('/dashboard/profile/settings')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-stone-50 hover:text-brand-800 dark:text-slate-300 dark:hover:bg-slate-900"><Cog6ToothIcon className="h-4 w-4" />Settings</Link><button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><ArrowLeftStartOnRectangleIcon className="h-4 w-4" />Logout</button></div></div></aside>
    <main className="min-h-screen min-w-0 pt-16 lg:ml-64"><div className="dashboard-content mx-auto w-full max-w-7xl min-w-0 px-3 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</div></main>
  </div>;
}
