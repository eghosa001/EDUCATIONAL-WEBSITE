import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <section className="w-full max-w-lg text-center">
        <h1 className="mb-2 text-6xl font-extrabold tracking-tight text-[#151A3A]">404</h1>
        <h2 className="mb-3 text-xl font-semibold text-slate-800">Admin page not found</h2>
        <p className="mb-8 text-slate-500">The administration page you requested does not exist or has been moved.</p>
        <Link href="/dashboard" className="inline-flex rounded-xl bg-[#151A3A] px-6 py-3 font-semibold text-white hover:bg-[#202750]">Back to dashboard</Link>
      </section>
    </main>
  );
}
