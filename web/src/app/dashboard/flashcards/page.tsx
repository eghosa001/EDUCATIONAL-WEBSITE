'use client';

import { useEffect, useState } from 'react';
import { BrainIcon, Check, ChevronLeft, ChevronRight, Loader2, LibraryBig } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { fetchMyFlashcards, fetchPrebuiltFlashcards } from '@/services/api/aiService';

interface Flashcard { id: string; front: string; back: string; subjectId?: string; topicId?: string; difficulty?: string; title?: string; }
interface Subject { id: string; name: string; }
interface Topic { id: string; name: string; }

export default function FlashcardsPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState('');
  const [cardCount, setCardCount] = useState(10);

  useEffect(() => {
    if (authLoading || !token) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const supabase = getSupabase();
        const [{ data: subjectRows, error: subjectError }, saved] = await Promise.all([
          supabase.from('subjects').select('id,name').eq('is_active', true).order('name'),
          fetchMyFlashcards(token, { page: 1, limit: 30 }),
        ]);
        if (subjectError) throw subjectError;
        if (!cancelled) {
          setSubjects((subjectRows || []) as Subject[]);
          setFlashcards((saved.flashcards || []) as Flashcard[]);
          setCurrentIndex(0);
          setIsFlipped(false);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Unable to load flashcards.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [authLoading, token]);

  useEffect(() => {
    setTopicId('');
    setTopics([]);
    if (!subjectId) return;
    let cancelled = false;
    setTopicsLoading(true);
    (async () => {
      const { data, error } = await getSupabase().from('topics').select('id,name').eq('subject_id', subjectId).eq('is_active', true).order('name').limit(500);
      if (!cancelled) {
        if (error) setError(error.message || 'Unable to load topics.');
        else {
          const unique = new Map<string, Topic>();
          for (const row of (data || []) as Topic[]) {
            const key = row.name.trim().toLowerCase();
            if (key && !unique.has(key)) unique.set(key, row);
          }
          setTopics([...unique.values()]);
        }
        setTopicsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subjectId]);

  const loadPrebuilt = async () => {
    if (!subjectId || loadingCards) return;
    setLoadingCards(true); setError('');
    try {
      const cards = await fetchPrebuiltFlashcards({ subjectId, topicId: topicId || undefined, limit: cardCount });
      if (!cards.length) throw new Error('No prebuilt flashcards are available for this selection yet.');
      setFlashcards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (e: any) {
      setError(e?.message || 'Unable to load prebuilt flashcards.');
    } finally {
      setLoadingCards(false);
    }
  };

  const move = (delta: number) => { setCurrentIndex(i => Math.max(0, Math.min(flashcards.length - 1, i + delta))); setIsFlipped(false); };
  const rate = (_rating: 'hard' | 'good' | 'easy') => move(1);

  if (authLoading || loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  const current = flashcards[currentIndex];
  const progress = flashcards.length ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  return <div className="space-y-6">
    <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-[#1b2045] dark:ring-slate-700">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">Spaced review • No AI wait</p>
      <h1 className="mt-2 text-2xl font-extrabold text-[#151A3A] dark:text-white">Flashcards</h1>
      <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-300">Study ready-made cards from the published curriculum. The cards are already stored, so opening a set does not wait for AI generation.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-brand-50 p-4 dark:bg-[#151A3A]"><b className="text-[#151A3A] dark:text-white">Known / still learning</b><p className="mt-1 text-sm text-slate-500">Rate every card to move forward.</p></div><div className="rounded-2xl bg-brand-50 p-4 dark:bg-[#151A3A]"><b className="text-[#151A3A] dark:text-white">Fast subject sets</b><p className="mt-1 text-sm text-slate-500">Open 10, 20 or 30 cards.</p></div><div className="rounded-2xl bg-brand-50 p-4 dark:bg-[#151A3A]"><b className="text-[#151A3A] dark:text-white">Tap to reveal</b><p className="mt-1 text-sm text-slate-500">Keep revision simple on phones.</p></div></div>
    </header>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
      <div className="mb-4 flex items-center gap-3"><LibraryBig className="h-5 w-5 text-brand-600"/><h2 className="font-bold text-[#151A3A] dark:text-white">Ready-made curriculum flashcards</h2></div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value="">Select a subject</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
        <select value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!subjectId || topicsLoading} className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-stone-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value="">{topicsLoading ? 'Loading topics…' : subjectId ? 'All topics in this subject' : 'Choose a subject first'}</option>{topics.map(topic => <option key={topic.id} value={topic.id}>{topic.name}</option>)}</select>
        <select value={cardCount} onChange={e => setCardCount(Number(e.target.value))} className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white" aria-label="Number of flashcards"><option value={10}>10 cards</option><option value={20}>20 cards</option><option value={30}>30 cards</option></select>
        <button onClick={() => void loadPrebuilt()} disabled={!subjectId || loadingCards} className="rounded-xl bg-[#151A3A] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{loadingCards ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Loading cards…</> : `Open ${cardCount} cards`}</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Choose a subject alone for a mixed revision set, or narrow it to a topic. These ready-made cards come from prebuilt lesson resources.</p>
    </section>

    {current ? <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm text-slate-500"><span>Card {currentIndex + 1} of {flashcards.length}</span><span className="truncate">{current.title || `${Math.round(progress)}% complete`}</span></div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-slate-700"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }}/></div>
      <button type="button" onClick={() => setIsFlipped(v => !v)} aria-label={isFlipped ? 'Show question' : 'Reveal answer'} className="group relative min-h-[280px] w-full [perspective:1000px]"><div className="relative min-h-[280px] w-full transition-transform duration-500 [transform-style:preserve-3d]" style={{ transform: isFlipped ? 'rotateY(180deg)' : undefined }}><div className="absolute inset-0 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-brand-200 bg-brand-50 p-8 [backface-visibility:hidden] dark:border-brand-900 dark:bg-brand-950/30"><span className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-600">Question</span><p className="max-w-3xl text-center text-lg font-semibold leading-8 text-slate-900 dark:text-white">{current.front}</p><span className="mt-5 text-xs text-slate-400">Tap to reveal answer</span></div><div className="absolute inset-0 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-emerald-900 dark:bg-emerald-950/30"><span className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-600">Answer</span><p className="max-w-3xl text-center text-lg leading-8 text-slate-900 dark:text-white">{current.back}</p></div></div></button>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><button onClick={() => move(-1)} disabled={currentIndex === 0} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm disabled:opacity-40"><ChevronLeft className="mr-1 inline h-4 w-4"/>Previous</button><div className="flex flex-wrap justify-center gap-2"><button onClick={() => rate('hard')} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">Hard</button><button onClick={() => rate('good')} className="rounded-xl border border-amber-200 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50">Good</button><button onClick={() => rate('easy')} className="rounded-xl border border-emerald-200 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50">Easy</button></div><button onClick={() => move(1)} disabled={currentIndex === flashcards.length - 1} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm disabled:opacity-40">Next<ChevronRight className="ml-1 inline h-4 w-4"/></button></div>
      <p className="mt-4 text-center text-xs text-slate-400"><Check className="mr-1 inline h-3 w-3"/>Rate a card to move to the next one.</p>
    </section> : <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#1b2045]"><BrainIcon className="mx-auto mb-4 h-12 w-12 text-stone-300"/><h3 className="font-semibold text-[#151A3A] dark:text-white">Choose what you want to revise</h3><p className="mt-2 text-sm text-slate-500">Select a subject above to open its already-prepared flashcards.</p></section>}
  </div>;
}
