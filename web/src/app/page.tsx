import Link from 'next/link';

const learningPaths = [
  { label: 'Primary', title: 'Build strong foundations', description: 'Clear curriculum lessons and guided practice for core primary-school subjects.' },
  { label: 'JSS', title: 'Master each school term', description: 'Move from class to subject to term, then study, practise and review with less friction.' },
  { label: 'SSS + Exams', title: 'Prepare with exam focus', description: 'Combine senior-secondary learning with CBT-style practice for WAEC, NECO, JAMB and NABTEB.' },
];

const features = [
  { number: '01', title: 'Curriculum learning', description: 'Structured topics and complete lessons organised around Nigerian classes, subjects and school terms.' },
  { number: '02', title: 'CBT & mock exams', description: 'Timed computer-based practice, secure grading and immediate review to build exam confidence.' },
  { number: '03', title: 'AI study support', description: 'Ask for explanations, study help and guided support when a topic needs another approach.' },
  { number: '04', title: 'Past questions', description: 'Practise exam-style questions and strengthen recall around the subjects that matter most.' },
  { number: '05', title: 'Flashcards & revision', description: 'Return to key ideas with focused revision tools instead of rereading everything from the beginning.' },
  { number: '06', title: 'Progress visibility', description: 'See learning activity and performance patterns so students and families know what to improve next.' },
];

const learningLoop = [
  ['Choose', 'Select your class, subject and term.'],
  ['Learn', 'Open a focused curriculum lesson.'],
  ['Practise', 'Answer questions or start a timed CBT session.'],
  ['Improve', 'Review results and return to weaker areas.'],
];

const exams = ['WAEC', 'NECO', 'JAMB / UTME', 'NABTEB'];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-stone-50 text-slate-900 dark:bg-[#151A3A] dark:text-slate-100">
      <nav className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-700/80 dark:bg-[#151A3A]/95">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="THE GUIDE home" className="flex shrink-0 items-center">
            <img src="/logos/primary-logo.jfif" alt="THE GUIDE" className="h-14 w-auto max-w-[210px] object-contain sm:h-16" />
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300 lg:flex">
            <a href="#learning" className="transition hover:text-[#151A3A] dark:hover:text-white">Learning</a>
            <a href="#exams" className="transition hover:text-[#151A3A] dark:hover:text-white">Exam prep</a>
            <a href="#parents" className="transition hover:text-[#151A3A] dark:hover:text-white">For families</a>
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
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700 shadow-sm dark:border-brand-800 dark:bg-[#1b2045] dark:text-brand-300">
                Nigerian curriculum • school + exam preparation
              </div>
              <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[#151A3A] dark:text-white sm:text-6xl lg:text-7xl">
                Study with structure. <span className="text-brand-600 dark:text-brand-300">Practise with purpose.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300 sm:text-xl">
                THE GUIDE brings curriculum lessons, CBT practice, past questions, AI study support and progress tracking into one learning path built for Nigerian students.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#151A3A] px-7 py-3.5 font-semibold text-white shadow-brand transition hover:-translate-y-0.5 hover:bg-[#202750]">Create a free account</Link>
                <Link href="/login" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-7 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 dark:border-slate-600 dark:bg-[#1b2045] dark:text-slate-100 dark:hover:bg-[#202750]">Continue learning</Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                {['Primary', 'JSS', 'SSS', 'WAEC', 'NECO', 'JAMB'].map((item) => <span key={item} className="rounded-full border border-stone-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-[#1b2045]">{item}</span>)}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="brand-gradient brand-glow rounded-[2rem] p-5 sm:p-7">
                <div className="rounded-[1.5rem] border border-white/10 bg-white/95 p-5 text-slate-900 shadow-2xl sm:p-7">
                  <div className="flex items-start justify-between gap-4 border-b border-stone-200 pb-5">
                    <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Your learning path</p><h2 className="mt-1 text-2xl font-bold text-[#151A3A]">SSS 2 • Biology</h2></div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">In progress</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    {[['1', 'Learn the topic', 'Nutrition and modes of feeding', 'Complete'], ['2', 'Test understanding', 'Topic practice questions', 'Next'], ['3', 'Build exam speed', '20-question timed CBT', 'Ready'], ['4', 'Review performance', 'Strengths and weak areas', 'After CBT']].map(([step, title, copy, status]) => (
                      <div key={step} className="flex gap-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#151A3A] text-sm font-bold text-white">{step}</div>
                        <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><h3 className="font-semibold text-[#151A3A]">{title}</h3><span className="text-xs font-semibold text-brand-700">{status}</span></div><p className="mt-1 text-sm text-slate-500">{copy}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-brand-200 bg-white px-4 py-3 shadow-brand sm:block"><p className="text-xs font-bold uppercase tracking-wider text-brand-700">One place</p><p className="mt-1 text-sm font-semibold text-[#151A3A]">Learn → practise → improve</p></div>
            </div>
          </div>
        </section>

        <section id="learning" className="border-y border-stone-200 bg-white py-16 dark:border-slate-700 dark:bg-[#1b2045] sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">Designed around the learner</p><h2 className="mt-3 text-3xl font-bold tracking-tight text-[#151A3A] dark:text-white sm:text-4xl">A clear route from today&apos;s lesson to tomorrow&apos;s result.</h2><p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-300">Instead of dropping students into a giant content library, THE GUIDE organises learning by level and moves each learner naturally from study to practice.</p></div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {learningPaths.map((path) => <article key={path.label} className="rounded-2xl border border-stone-200 bg-stone-50 p-6 shadow-sm dark:border-slate-700 dark:bg-[#151A3A]"><span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">{path.label}</span><h3 className="mt-5 text-xl font-bold text-[#151A3A] dark:text-white">{path.title}</h3><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{path.description}</p></article>)}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div className="max-w-3xl"><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">One connected platform</p><h2 className="mt-3 text-3xl font-bold text-[#151A3A] dark:text-white sm:text-4xl">The tools students need, connected to the same learning journey.</h2></div><Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">Explore with an account →</Link></div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => <article key={feature.title} className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-brand dark:border-slate-700 dark:bg-[#1b2045]"><div className="text-sm font-extrabold tracking-wider text-brand-600">{feature.number}</div><h3 className="mt-6 text-xl font-bold text-[#151A3A] dark:text-white">{feature.title}</h3><p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">{feature.description}</p></article>)}
            </div>
          </div>
        </section>

        <section id="exams" className="bg-[#151A3A] py-16 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">Exam preparation</p><h2 className="mt-3 text-3xl font-bold sm:text-4xl">Practise in the format that rewards speed, accuracy and confidence.</h2><p className="mt-5 text-lg leading-8 text-slate-300">Use timed practice and exam-style questions alongside your curriculum learning, so revision is connected to what you have actually studied.</p><div className="mt-7 flex flex-wrap gap-2">{exams.map((exam) => <span key={exam} className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-stone-100">{exam}</span>)}</div></div>
              <div className="grid gap-4 sm:grid-cols-2">{learningLoop.map(([title, copy], index) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><div className="text-sm font-extrabold text-brand-300">0{index + 1}</div><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 leading-6 text-slate-300">{copy}</p></div>)}</div>
            </div>
          </div>
        </section>

        <section id="parents" className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 rounded-[2rem] border border-stone-200 bg-white p-7 shadow-brand-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-10 lg:grid-cols-2 lg:p-14">
              <div><p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">For students and families</p><h2 className="mt-3 text-3xl font-bold text-[#151A3A] dark:text-white sm:text-4xl">Progress should be visible, not guessed.</h2><p className="mt-5 text-lg leading-8 text-slate-600 dark:text-slate-300">Learning reports and performance views help students understand where they are improving and give parents a clearer picture of where support may be needed.</p></div>
              <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl bg-brand-50 p-5 dark:bg-[#151A3A]"><p className="text-3xl font-extrabold text-[#151A3A] dark:text-white">See</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">recent learning activity and completed work</p></div><div className="rounded-2xl bg-brand-50 p-5 dark:bg-[#151A3A]"><p className="text-3xl font-extrabold text-[#151A3A] dark:text-white">Spot</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">subjects and topics that need more attention</p></div><div className="rounded-2xl bg-brand-50 p-5 dark:bg-[#151A3A]"><p className="text-3xl font-extrabold text-[#151A3A] dark:text-white">Track</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">practice and assessment performance over time</p></div><div className="rounded-2xl bg-brand-50 p-5 dark:bg-[#151A3A]"><p className="text-3xl font-extrabold text-[#151A3A] dark:text-white">Plan</p><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">the next revision step with clearer priorities</p></div></div>
            </div>
          </div>
        </section>

        <section className="pb-16 sm:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="brand-gradient brand-glow overflow-hidden rounded-[2rem] px-7 py-12 text-center sm:px-12 sm:py-16"><img src="/logos/primary-logo.jfif" alt="THE GUIDE" className="mx-auto mb-6 h-20 w-auto max-w-[220px] rounded-lg object-contain" /><h2 className="text-3xl font-bold text-white sm:text-4xl">Give every study session a direction.</h2><p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-stone-200">Start with your level, learn the right topic, practise what you know and use your results to decide what comes next.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/register" className="rounded-xl bg-white px-7 py-3.5 font-semibold text-[#151A3A] transition hover:bg-brand-50">Start learning free</Link><Link href="/login" className="rounded-xl border border-white/20 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10">Log in</Link></div></div></div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white dark:border-slate-700 dark:bg-[#151A3A]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-9 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8"><Link href="/" aria-label="THE GUIDE home"><img src="/logos/primary-logo.jfif" alt="THE GUIDE" className="h-12 w-auto max-w-[180px] object-contain" /></Link><div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400"><a href="#learning" className="hover:text-brand-700">Learning</a><a href="#exams" className="hover:text-brand-700">Exam prep</a><a href="#parents" className="hover:text-brand-700">Families</a><span>© {new Date().getFullYear()} THE GUIDE</span></div></div>
      </footer>
    </div>
  );
}
