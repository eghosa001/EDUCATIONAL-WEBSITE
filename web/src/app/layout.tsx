import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-ogs7.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'THE GUIDE', template: '%s | THE GUIDE' },
  description: 'THE GUIDE — Your path to smarter learning',
  applicationName: 'THE GUIDE',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/logos/app-icon.jfif', apple: '/logos/app-icon.jfif' },
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    title: 'THE GUIDE',
    description: 'Your path to smarter learning',
    url: '/',
    siteName: 'THE GUIDE',
    images: [{ url: '/logos/primary-logo.jfif', alt: 'THE GUIDE' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THE GUIDE',
    description: 'Your path to smarter learning',
    images: ['/logos/primary-logo.jfif'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#151A3A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>{children}</AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
