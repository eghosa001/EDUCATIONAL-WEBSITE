'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
interface ThemeContextType { theme: Theme; resolvedTheme: ResolvedTheme; setTheme: (theme: Theme) => void; }
const ThemeContext = createContext<ThemeContextType>({ theme: 'system', resolvedTheme: 'light', setTheme: () => {} });
const STORAGE_KEY = 'edu-theme';

function readSavedTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Read stored preferences before persisting anything. Otherwise the first
    // render can accidentally overwrite a saved choice with "system".
    setThemeState(readSavedTheme());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const apply = () => {
      const next = resolveTheme(theme);
      setResolvedTheme(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.style.colorScheme = next;
    };
    apply();
    try { window.localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage may be unavailable */ }

    // Follow operating-system changes only when the user hasn't chosen a mode.
    if (theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener?.('change', apply);
    return () => query.removeEventListener?.('change', apply);
  }, [theme, ready]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    // Apply immediately so the button never feels delayed on a phone.
    const resolved = resolveTheme(next);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
    setResolvedTheme(resolved);
    try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* optional preference */ }
  }, []);

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }

export function ThemeToggle({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const next: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      data-theme-toggle
      data-current-theme={resolvedTheme}
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-stone-300 bg-white text-[#151A3A] shadow-sm transition-colors hover:border-brand-500 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:border-slate-600 dark:bg-[#202650] dark:text-brand-200 dark:hover:bg-[#30385f] dark:focus-visible:ring-brand-300 dark:focus-visible:ring-offset-[#151A3A] ${compact ? 'w-11' : 'gap-2 px-3'} ${className}`}
    >
      {resolvedTheme === 'dark' ? <Sun className="h-[19px] w-[19px]" aria-hidden="true" /> : <Moon className="h-[19px] w-[19px]" aria-hidden="true" />}
      {!compact && <span className="text-sm font-semibold">{resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
    </button>
  );
}
