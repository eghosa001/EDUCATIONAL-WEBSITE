'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthStore } from '@/state/auth/authStore';
import {
  Home, BookOpen, GraduationCap as AcademicCapIcon, ClipboardCheck as ClipboardDocumentCheckIcon,
  MessageSquare as ChatBubbleLeftRightIcon, Bookmark as LibraryBookmarkIcon, Lightbulb as LightBulbIcon,
  Users as UserGroupIcon, Trophy, Bell, ChevronDown,
  LogOut as ArrowRightOnRectangleIcon, Menu as Bars3Icon, X as XMarkIcon,
  Settings as Cog6ToothIcon, LogOut as ArrowLeftStartOnRectangleIcon,
} from 'lucide-react';

const studentNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Courses', href: '/dashboard/courses', icon: BookOpen },
  { label: 'Lessons', href: '/dashboard/lessons', icon: AcademicCapIcon },
  { label: 'Exams', href: '/dashboard/exams', icon: ClipboardDocumentCheckIcon },
  { label: 'Past Questions', href: '/dashboard/past-questions', icon: LibraryBookmarkIcon },
  { label: 'AI Tutor', href: '/dashboard/ai/tutor', icon: LightBulbIcon },
  { label: 'Flashcards', href: '/dashboard/flashcards', icon: AcademicCapIcon },
  { label: 'Community', href: '/dashboard/community', icon: ChatBubbleLeftRightIcon },
  { label: 'Progress', href: '/dashboard/progress', icon: Trophy },
];

const teacherNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'My Courses', href: '/dashboard/courses', icon: BookOpen },
  { label: 'Lessons', href: '/dashboard/lessons', icon: AcademicCapIcon },
  { label: 'Assignments', href: '/dashboard/assignments', icon: ClipboardDocumentCheckIcon },
  { label: 'Students', href: '/dashboard/teacher', icon: UserGroupIcon },
  { label: 'Earnings', href: '/dashboard/teacher', icon: Trophy },
];

const parentNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'My Children', href: '/dashboard/parent', icon: UserGroupIcon },
  { label: 'Progress', href: '/dashboard/progress', icon: Trophy },
  { label: 'Results', href: '/dashboard/exams', icon: ClipboardDocumentCheckIcon },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);

  useEffect(() => {
    if (!isAuthenticated && !pathname.startsWith('/login') && !pathname.startsWith('/register')) {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  const getNavItems = () => {
    if (!user) return studentNavItems;
    if (user.role === 'teacher') return teacherNavItems;
    if (user.role === 'parent') return parentNavItems;
    return studentNavItems;
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-14 flex items-center px-4 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <AcademicCapIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">EduPlatform</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
          {sidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-14 flex items-center px-4 border-b border-gray-100">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <AcademicCapIcon className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">EduPlatform</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden ml-auto p-1 rounded hover:bg-gray-100">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto py-4 px-2">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <Link
              href="/dashboard/profile/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg w-full"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg w-full"
            >
              <ArrowLeftStartOnRectangleIcon className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 pt-14 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
