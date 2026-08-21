'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
interface ThemeContextType { theme: Theme; resolvedTheme: 'light' | 'dark'; setTheme: (theme: Theme) => void; }
const ThemeContext = createContext<ThemeContextType>({ theme: 'system', resolvedTheme: 'light', setTheme: () => {} });

const getPreferredTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem('edu-theme');
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => { const stored = localStorage.getItem('edu-theme') as Theme | null; if (stored) setThemeState(stored); }, []);
  useEffect(() => {
    const resolved = theme === 'system' ? getPreferredTheme() : theme;
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
    localStorage.setItem('edu-theme', theme);
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
  return <button onClick={() => setTheme(next)} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-brand-300" title={`Switch to ${next} mode`} aria-label={`Switch to ${next} mode`}>
    {resolvedTheme === 'dark' ? <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg> : <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
    <span className="hidden sm:inline">{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
  </button>;
}
