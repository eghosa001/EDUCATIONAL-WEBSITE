import type { Metadata } from 'next';
import { ThemeToggle } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>
    <div className="fixed right-4 top-4 z-[60] sm:right-6 sm:top-6"><ThemeToggle compact /></div>
    {children}
  </>;
}
