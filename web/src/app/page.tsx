import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { ThemeToggle } from '@/contexts/ThemeContext';

const examBodies = [
  { title: 'JAMB / UTME', tag: '4-subject CBT', detail: 'Build your subject combination, choose question count and practise in a timed exam room.', href: '/login' },
  { title: 'WAEC', tag: 'School exam', detail: 'Practise WAEC-aligned questions by subject while keeping the board separate from NECO and JAMB.', href: '/login' },
  { title: 'NECO', tag: 'Senior secondary', detail: 'Use a clean NECO path for subject practice, CBT setup and score review.', href: '/login' },
  { title: 'NABTEB', tag: 'Technical exam', detail: 'Keep business, trade and technical revision organised in its own exam route.', href: '/login' },
];

const journey = [
  { title: 'Choose exam body', copy: 'Start with JAMB, WAEC, NECO, NABTEB or class practice so materials never feel mixed.' },
  { title: 'Subject selection', copy: 'Pick the exact subject or JAMB combination before entering practice.' },
  { title: 'Question count', copy: 'Choose a small daily drill or a fuller CBT session depending on available time.' },
  { title: 'Timed or untimed', copy: 'Practise calmly first, then switch to exam-speed CBT when ready.' },
  { title: 'Score review', copy: 'Review wrong answers, explanations and weak areas immediately after submission.' },
];

const retention = [
  { title: 'Recently viewed', copy: 'Return to the last lesson, subject, CBT or flashcard set without searching again.' },
  { title: 'Saved questions', copy: 'Keep difficult questions and explanations together for focused revision.' },
  { title: 'Daily practice', copy: 'Use a short repeatable session so students can come back every day.' },
  { title: 'Weak-topic review', copy: 'Turn scores into the next recommended subject or topic.' },
];

const studyModes = [
  { title: 'CBT setup', copy: 'Exam body, subject selection, question count and timer choice appear before the exam starts.' },
  { title: 'Flashcards', copy: 'Ready-made cards open quickly for memory work and short revision breaks.' },
  { title: 'Review wrong answers', copy: 'Students leave each practice session knowing exactly what to fix next.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 text-slate-900 dark:bg-[#151A3A] dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-700/80 dark:bg-[#151A3A]/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
          <BrandLogo href="/" compact className="shrink-0" />
          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
            <a href="#exam-entry" className="transition hover:text-[#151A3A] dark:hover:text-white">Exam entry</a>
            <a href="#study-flow" className="transition hover:text-[#151A3A] dark:hover:text-white">Study flow</a>
            <a href="#return" className="transition hover:text-[#151A3A] dark:hover:text-white">Return</a>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            <ThemeToggle compact />
            <Link href="/login" className="rounded-lg px-1.5 py-2 text-xs font-semibold sm:px-3 sm:text-sm text-slate-600 transition hover:text-brand-700 dark:text-slate-300 dark:hover:text-brand-300">Log in</Link>
            <Link href="/register" className="rounded-xl bg-[#151A3A] px-2 py-2.5 text-xs font-semibold text-white shadow-brand-sm transition hover:bg-[#202750] dark:bg-brand-500 dark:text-[#151A3A] dark:hover:bg-brand-400 sm:px-4 sm:text-sm"><span className="sm:hidden">Start</span><span className="hidden sm:inline">Start learning</span></Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-x-0 top-0 -z-10 h-[35rem] bg-[radial-gradient(circle_at_80%_12%,rgba(184,147,79,0.18),transparent_34%),radial-gradient(circle_at_10%_10%,rgba(21,26,58,0.08),transparent_32%)]" />
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.04fr_0.96fr] lg:items-center lg:px-8 lg:py-24">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700 shadow-sm dark:border-brand-800 dark:bg-[#1b2045] dark:text-brand-300">
                Nigerian curriculum • CBT • revision
              </div>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#151A3A] dark:text-white sm:text-6xl lg:text-7xl">
                One clear study path. <span className="text-brand-600 dark:text-brand-300">No exam confusion.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
                THE GUIDE helps Nigerian students move from exam body to subject selection, question count, timed or untimed practice and score review without overwhelming the first screen.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#151A3A] px-7 py-3.5 font-semibold text-white shadow-brand transition hover:-translate-y-0.5 hover:bg-[#202750] dark:bg-brand-500 dark:text-[#151A3A] dark:hover:bg-brand-400">Create free account</Link>
                <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-7 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-600 dark:bg-[#1b2045] dark:text-slate-100 dark:hover:bg-[#202750]">Continue learning</Link>
              </div>
            </div>

            <div className="brand-gradient brand-glow rounded-[2rem] p-5 sm:p-7">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/95 p-5 text-slate-900 shadow-2xl sm:p-7">
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Today&apos;s study board</p>
                    <h2 className="mt-1 text-2xl font-bold text-[#151A3A]">Next best step</h2>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">Ready</span>
                </div>
                <div className="mt-6 space-y-3">
                  {['Continue last CBT', 'Open saved questions', 'Review weak topic', 'Start 20-question drill'].map((item, index) => (
                    <div key={item} className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#151A3A] text-sm font-bold text-white">{index + 1}</div>
                      <p className="font-semibold text-[#151A3A]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="exam-entry" className="border-y border-stone-200 bg-white py-14 dark:border-slate-700 dark:bg-[#1b2045] sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">Choose exam body</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#151A3A] dark:text-white sm:text-4xl">Start from the exam. Then choose the subject.</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">JAMB, WAEC, NECO and NABTEB each has a separate route, separate language and separate practice mode.</p>
              </div>
              <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">Sign in to start →</Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {examBodies.map((exam) => (
                <Link key={exam.title} href={exam.href} className="group rounded-2xl border border-stone-200 bg-stone-50 p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:bg-white hover:shadow-brand dark:border-slate-700 dark:bg-[#151A3A] dark:hover:bg-[#1b2045]">
                  <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800 dark:bg-brand-950 dark:text-brand-200">{exam.tag}</span>
                  <h3 className="mt-5 text-xl font-extrabold text-[#151A3A] dark:text-white">{exam.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{exam.detail}</p>
                  <span className="mt-5 inline-flex text-sm font-bold text-brand-700 dark:text-brand-300">Open path →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="study-flow" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">Study flow</p>
              <h2 className="mt-3 text-3xl font-bold text-[#151A3A] dark:text-white sm:text-4xl">Every page should answer: what should I do next?</h2>
              <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">The product is designed around action, not long explanations.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-5">
              {journey.map((step, index) => (
                <article key={step.title} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
                  <span className="text-xs font-extrabold text-brand-700 dark:text-brand-300">0{index + 1}</span>
                  <h3 className="mt-4 font-extrabold text-[#151A3A] dark:text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#151A3A] py-14 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">Focused modes</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">CBT, flashcards and review work together.</h2>
                <p className="mt-5 text-lg leading-8 text-slate-300">Students can practise, revise and correct mistakes from one consistent learning loop.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {studyModes.map((mode) => (
                  <article key={mode.title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                    <h3 className="text-lg font-bold">{mode.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{mode.copy}</p>
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
                <h2 className="mt-3 text-3xl font-bold text-[#151A3A] dark:text-white sm:text-4xl">Progress should bring the student back tomorrow.</h2>
                <p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">Recently viewed work, saved questions and weak-topic review reduce friction for the next session.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {retention.map((item) => (
                  <div key={item.title} className="rounded-2xl bg-brand-50 p-5 dark:bg-[#151A3A]">
                    <p className="text-2xl font-extrabold text-[#151A3A] dark:text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.copy}</p>
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
              <h2 className="text-3xl font-bold text-white sm:text-4xl">Start small. Practise daily. Review clearly.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-stone-200">A polished education site should help students act quickly and return with purpose.</p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link href="/register" className="rounded-xl bg-white px-7 py-3.5 font-semibold text-[#151A3A] transition hover:bg-brand-50">Start learning free</Link>
                <Link href="/login" className="rounded-xl border border-white/20 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">Log in</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
