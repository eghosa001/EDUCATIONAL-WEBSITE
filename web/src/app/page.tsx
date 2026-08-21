import Link from 'next/link';

const features = [
  { title: 'Structured Courses', description: 'Curriculum-aligned courses from primary school through university level.', icon: '📚' },
  { title: 'AI Tutor', description: 'Get personalized help from an AI-powered tutor available 24/7.', icon: '✦' },
  { title: 'Past Questions', description: 'Practice with WAEC, NECO, JAMB, and NABTEB past questions.', icon: '✓' },
  { title: 'Exams & Quizzes', description: 'Test your knowledge with timed exams and instant feedback.', icon: '⌁' },
  { title: 'Flashcards', description: 'Memorize key concepts with spaced repetition flashcards.', icon: '▣' },
  { title: 'Track Progress', description: 'Monitor your learning journey with detailed analytics and reports.', icon: '↗' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="w-9 h-9" />
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">THE GUIDE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Log in</Link>
            <Link href="/register" className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sign up</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="w-24 h-24 mx-auto mb-6" />
            <p className="text-sm font-semibold tracking-[0.2em] text-blue-600 uppercase">Learn. Practice. Master.</p>
            <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
              Your Path to <span className="text-blue-600">Smarter Learning</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              A comprehensive Nigerian educational platform covering primary school through university. Courses, AI tutoring, past questions, and more.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 text-center">Get Started Free</Link>
              <Link href="/login" className="w-full sm:w-auto px-8 py-3.5 bg-white text-gray-700 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 text-center">I have an account</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to succeed</h2>
            <p className="mt-3 text-gray-600 text-lg">Built for Nigerian students at every level</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all">
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 text-xl">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-2xl px-8 py-12 sm:px-16 sm:py-16 text-center">
            <h2 className="text-3xl font-bold text-white">Ready to start learning?</h2>
            <p className="mt-3 text-blue-100 text-lg">Build knowledge, confidence, and results with THE GUIDE.</p>
            <Link href="/register" className="inline-block mt-8 px-8 py-3.5 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50">Create your account</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logos/the-guide-mark.svg" alt="THE GUIDE" className="w-7 h-7" />
            <span className="text-sm font-semibold text-gray-900">THE GUIDE</span>
          </Link>
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} THE GUIDE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
