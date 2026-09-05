'use client';

import { useEffect } from 'react';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {}, []);

  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 dark:bg-[#151A3A]">
          <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-slate-900">
            <h1 className="mb-2 text-2xl font-bold text-[#151A3A] dark:text-white">Something went wrong</h1>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">THE GUIDE could not load the administration page. Please try again.</p>
            <button onClick={() => reset()} className="rounded-xl bg-[#151A3A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#202750]">Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
