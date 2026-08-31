import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';

export const metadata = {
  title: { default: 'THE GUIDE', template: '%s | THE GUIDE' },
  description: 'THE GUIDE — Your path to smarter learning',
  icons: { icon: '/logos/app-icon.jfif', apple: '/logos/app-icon.jfif' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" suppressHydrationWarning><head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><meta name="theme-color" content="#151A3A" /><meta property="og:title" content="THE GUIDE" /><meta property="og:description" content="Your path to smarter learning" /><meta property="og:image" content="/logos/primary-logo.jfif" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet" /></head><body><ThemeProvider><ErrorBoundary><AuthProvider>{children}</AuthProvider></ErrorBoundary></ThemeProvider></body></html>);
}
