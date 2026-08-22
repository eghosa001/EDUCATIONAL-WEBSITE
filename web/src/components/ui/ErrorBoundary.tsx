'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error.message, info.componentStack); }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return <div className="flex min-h-[60vh] items-center justify-center bg-stone-50 px-4 dark:bg-[#151A3A]"><div className="max-w-md text-center"><div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-950/30"><svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg></div><img src="/logos/the-guide-mark.webp" alt="THE GUIDE" className="mx-auto mb-3 h-10 w-10 rounded-[28%] object-cover" /><h2 className="mb-2 text-xl font-bold text-[#151A3A] dark:text-white">Something went wrong</h2><p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{this.state.error?.message || 'An unexpected error occurred'}</p><button onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="rounded-xl bg-[#151A3A] px-6 py-2.5 text-sm font-semibold text-white shadow-brand-sm transition hover:bg-[#202750]">Try Again</button></div></div>;
    }
    return this.props.children;
  }
}
