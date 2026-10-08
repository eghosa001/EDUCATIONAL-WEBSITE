import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

const examBodies = [
  {
    title: 'JAMB / UTME',
    tag: '4-subject CBT',
    description: 'Build the exact subject combination, practise past questions, then enter a timed CBT setup when ready.',
    href: '/login',
  },
  {
    title: 'WAEC',
    tag: 'School exam prep',
    description: 'Study subject-by-subject with practice that stays separate from JAMB and other exam bodies.',
    href: '/login',
  },
  {
    title: 'NECO',
    tag: 'Senior secondary',
    description: 'Revise verified topics and practise with a clean school-exam path for NECO preparation.',
    href: '/login',
  },
  {
    title: 'NABTEB',
    tag: 'Technical subjects',
    description: 'Keep technical and business examination practice organised away from WAEC and NECO content.',
    href: '/login',
  },
];

const studyModes = [
  { title: 'CBT setup', description: 'Choose exam body, subject, number of questions and timed or untimed mode before starting.' },
  { title: 'Flashcards', description: 'Open fast prebuilt cards for quick revision without waiting for AI generation.' },
  { title: 'Review wrong answers', description: 'Return to missed questions, explanations and weak areas after every practice session.' },
];

const learningPaths = [
  { label: 'Primary', title: 'Build strong foundations', description: 'Short lessons and guided practice for core primary-school subjects.' },
  { label: 'JSS', title: 'Master each school term', description: 'Move from class to subject to term, then study, practise and review with less friction.' },
  { label: 'SSS + Exams', title: 'Prepare with exam focus', description: 'Connect senior-secondary learning with WAEC, NECO, JAMB and NABTEB preparation.' },
];

const retentionLoop = [
  ['Continue', 'Resume the last lesson, CBT or flashcard set.'],
  ['Practise', 'Take a focused subject session instead of scrolling.'],
  ['Review', 'Study corrections, weak topics and explanations.'],
  ['Return', 'Use daily practice to keep progress visible.'],
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 text-slate-900 dark:bg-[#151A3A] dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-700/80 dark:bg-[#151A3A]/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo href="/" compact className="shrink-0" />
          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
            <a href="#exam-entry" className="transition hover:text-[#151A3A] dark:hover:text-white">Exam entry</a>
            <a href="#learning" className="transition hover:text-[#151A3A] dark:hover:text-white">Learning</a>
            <a href="#return" className="transition hover:text-[#151A3A] dark:hover:text-white">Daily progress</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300">Log in</Link>
            <Link href="/register" className="rounded-xl bg-[#151A3A] px-4 py-2.5 text-sm font-semibold text-white shadow-brand-sm transition hover:bg-[#202750]">Start learning</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_80%_12%,rgba(184,147,79,0.16),transparent_34%),radial-gradient(circle_at_10%_10%,rgba(21,26,58,0.08),transparent_32%)] dark:bg-[radial-gradient(circle_at_80%_12%,rgba(184,147,79,0.16),transparent_34%)]" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700 shadow-sm dark:border-brand-800 dark:bg-[#1b2045] dark:text-brand-300">
                Nigerian curriculum • CBT • revision
              </div>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#151A3A] dark:text-white sm:text-6xl lg:text-7xl">
                Choose what to study. <span className="text-brand-600 dark:text-brand-300">Know what to do next.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
                THE GUIDE gives Nigerian students a cleaner route into lessons, CBT practice, past questions, fast flashcards and result review without mixing exam bodies or overwhelming the first screen.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#151A3A] px-7 py-3.5 font-semibold text-white shadow-brand transition hover:-translate-y-0.5 hover:bg-[#202750]">Create a free account</Link>
                <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-7 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-600 dark:bg-[#1b2045] dark:text-slate-100 dark:hover:bg-[#202750]">Continue learning</Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="brand-gradient brand-glow rounded-[2rem] p-5 sm:p-7">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/95 p-5 text-slate-900 shadow-2xl sm:p-7">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Student dashboard preview</p>
                      <h2 className="mt-1 text-2xl font-bold text-[#151A3A]">Today&apos;s study path</h2>
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">3 actions</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    {[
                      ['1', 'Resume', 'Continue last CBT or lesson', '2 min'],
                      ['2', 'Practise', 'Open a focused subject session', '20 questions'],
                      ['3', 'Review', 'Fix weak areas and wrong answers', 'After scoring'],
                    ].map(([step, title, copy, status]) => (
                      <div key={step} className="flex gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#151A3A] text-sm font-bold text-white">{step}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold text-[#151A3A]">{title}</h3>
                            <span className="text-xs font-semibold text-brand-700">{status}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">{copy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-brand sm:block">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Return loop</p>
                <p className="mt-1 text-sm font-semibold text-[#151A3A]">Continue → practise → review</p>
              </div>
            </div>
          </div>
        </section>

        <section id="exam-entry" className="border-y border-stone-200 bg-white py-14 dark:border-slate-700 dark:bg-[#1b2045] sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">Choose exam body</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#151A3A] dark:text-white sm:text-4xl">Start from the exam you are preparing for.</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Each board has its own route, subject selection and practice mode so students do not confuse JAMB, WAEC, NECO and NABTEB materials.</p>
              </div>
              <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">Sign in to start →</Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {examBodies.map((exam) => (
                <Link key={exam.title} href={exam.href} className="group rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:bg-white hover:shadow-brand dark:border-slate-700 dark:bg-[#151A3A] dark:hover:bg-[#1b2045]">
                  <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800 dark:bg-brand-950 dark:text-brand-200">{exam.tag}</span>
                  <h3 className="mt-5 text-xl font-extrabold text-[#151A3A] dark:text-white">{exam.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{exam.description}</p>
                  <span className="mt-5 inline-flex text-sm font-bold text-brand-700 dark:text-brand-300">Open path →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="learning" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">Focused study modes</p>
              <h2 className="mt-3 text-3xl font-bold text-[#151A3A] dark:text-white sm:text-4xl">The first screen should lead to action, not long explanations.</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Students get short, clear choices: set up CBT, revise with flashcards, or review mistakes from earlier work.</p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {studyModes.map((mode) => (
                <article key={mode.title} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
                  <h3 className="text-xl font-extrabold text-[#151A3A] dark:text-white">{mode.title}</h3>
                  <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{mode.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#151A3A] py-14 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">Learning levels</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">School learning and external exams stay connected, but not mixed.</h2>
                <p className="mt-5 text-lg leading-8 text-slate-300">The platform supports normal curriculum study while keeping exam-board practice clearly labelled and separated.</p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {learningPaths.map((path) => (
                  <article key={path.label} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                    <span className="text-xs font-bold uppercase tracking-wider text-brand-300">{path.label}</span>
                    <h3 className="mt-4 text-lg font-bold">{path.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{path.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="return" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 rounded-[2rem] border border-stone-200 bg-white p-7 shadow-brand-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:p-14">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">Built for return visits</p>
                <h2 className="mt-3 text-3xl font-bold text-[#151A3A] dark:text-white sm:text-4xl">Progress should tell the student what to do tomorrow.</h2>
                <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">The experience should bring students back to recent work, saved revision, weak topics and next recommended sessions.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {retentionLoop.map(([title, copy]) => (
                  <div key={title} className="rounded-2xl bg-brand-50 p-5 dark:bg-[#151A3A]">
                    <p className="text-2xl font-extrabold text-[#151A3A] dark:text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="brand-gradient brand-glow overflow-hidden rounded-[2rem] px-7 py-12 text-center sm:px-12 sm:py-16">
              <div className="mb-6 flex justify-center"><BrandLogo href="/" inverse /></div>
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Give every study session a direction.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-stone-200">Start with the right exam body or class level, practise in a focused mode, then return to corrections and weak areas.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register" className="rounded-xl bg-white px-7 py-3.5 font-semibold text-[#151A3A] transition hover:bg-brand-50">Start learning free</Link>
                <Link href="/login" className="rounded-xl border border-white/20 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">Log in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white dark:border-slate-700 dark:bg-[#151A3A]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-9 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <BrandLogo href="/" compact />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <a href="#exam-entry" className="hover:text-brand-700">Exam entry</a>
            <a href="#learning" className="hover:text-brand-700">Study modes</a>
            <a href="#return" className="hover:text-brand-700">Daily progress</a>
            <span>© {new Date().getFullYear()} THE GUIDE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
