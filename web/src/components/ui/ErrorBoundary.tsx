'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('[ErrorBoundary]', error, info.componentStack); }
  reset = () => { this.setState({ hasError: false, error: null }); };
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex min-h-[60vh] items-center justify-center bg-stone-50 px-4 dark:bg-[#151A3A]">
          <div className="max-w-md text-center">
            <img src="/logos/the-guide-mark.webp" alt="THE GUIDE" className="mx-auto mb-4 h-12 w-12 rounded-[28%] object-cover" />
            <h2 className="mb-2 text-xl font-bold text-[#151A3A] dark:text-white">Something went wrong</h2>
            <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">This page could not be displayed. You can retry without leaving the app.</p>
            <div className="flex justify-center gap-3">
              <button onClick={this.reset} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Retry</button>
              <button onClick={() => window.location.reload()} className="rounded-xl bg-[#151A3A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#202750]">Reload</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
