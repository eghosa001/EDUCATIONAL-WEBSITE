import { AuthProvider } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="THE GUIDE — Your path to smarter learning" />
        <meta property="og:title" content="THE GUIDE" />
        <meta property="og:description" content="Your path to smarter learning" />
        <meta property="og:image" content="/logos/the-guide-mark.svg" />
        <link rel="icon" href="/logos/the-guide-mark.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>{children}</AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
