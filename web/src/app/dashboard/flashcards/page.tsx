'use client';

import { useEffect, useState } from 'react';
import { BrainIcon, Check, ChevronLeft, ChevronRight, Loader2, LibraryBig } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getSupabase } from '@/lib/supabase';
import { fetchMyFlashcards, fetchPrebuiltFlashcards } from '@/services/api/aiService';
import { parseFlashcardId, scheduleFlashcard, selectDueFlashcards, type RecallRating, type ReviewState } from '@/lib/flashcardReview';

interface Flashcard { id: string; front: string; back: string; subjectId?: string; topicId?: string; difficulty?: string; title?: string; }
interface Subject { id: string; name: string; }
interface SchoolClass { id: string; name: string; code: string; }
interface SchoolTerm { id: string; name: string; }
interface Topic { id: string; name: string; term_id: string; }

export default function FlashcardsPage() {
  const { token, user, isLoading: authLoading } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<SchoolClass[]>([]);
  const [terms, setTerms] = useState<SchoolTerm[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [classId, setClassId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCards, setLoadingCards] = useState(false);
  const [error, setError] = useState('');
  const [cardCount, setCardCount] = useState(10);
  const [studyOrder, setStudyOrder] = useState<number[]>([]);
  const [masteredInSession, setMasteredInSession] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});
  const [aheadCards, setAheadCards] = useState<Flashcard[]>([]);
  const [dueMessage, setDueMessage] = useState('');
  const [syncing, setSyncing] = useState(0);
  const [failedWrites, setFailedWrites] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    if (authLoading || !token) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true); setError('');
      try {
        const supabase = getSupabase();
        const [{ data: subjectRows, error: subjectError }, { data: classRows }, { data: termRows }, saved] = await Promise.all([
          supabase.from('subjects').select('id,name').eq('is_active', true).order('name'),
          supabase.from('classes').select('id,name,code').order('name'),
          supabase.from('terms').select('id,name').order('name'),
          fetchMyFlashcards(token, { page: 1, limit: 30 }).catch(() => ({ flashcards: [] as Flashcard[] })),
        ]);
        if (subjectError) throw subjectError;
        if (!cancelled) {
          setSubjects((subjectRows || []) as Subject[]);
          setSchoolClasses((classRows || []) as SchoolClass[]);
          setTerms((termRows || []) as SchoolTerm[]);
          const savedCards = (saved.flashcards || []) as Flashcard[];
          // Reuse the same account review history for learner-created decks.
          // The initial saved set should not restart mastered cards as "new".
          const savedSetIds = [...new Set(savedCards.map(card => parseFlashcardId(card.id)?.flashcard_id).filter((id): id is string => Boolean(id)))];
          const savedReviews: Record<string, ReviewState> = {};
          if (user?.id && savedSetIds.length) {
            const { data: pastReviews, error: pastReviewError } = await supabase
              .from('flashcard_reviews')
              .select('flashcard_id,card_index,ease_factor,interval_days,next_review_at,reviews_count,last_answer_correct')
              .eq('user_id', user.id)
              .in('flashcard_id', savedSetIds);
            if (pastReviewError) throw pastReviewError;
            for (const entry of pastReviews || []) {
              savedReviews[`${entry.flashcard_id}:${entry.card_index}`] = {
                ease_factor: Number(entry.ease_factor) || 2.5,
                interval_days: Number(entry.interval_days) || 0,
                next_review_at: entry.next_review_at,
                reviews_count: Number(entry.reviews_count) || 0,
                last_answer_correct: entry.last_answer_correct,
              };
            }
          }
          const availableSaved = selectDueFlashcards(savedCards, savedReviews, 30);
          if (cancelled) return;
          setReviews(savedReviews);
          setFlashcards(availableSaved.cards);
          setStudyOrder(availableSaved.cards.map((_, index) => index));
          setCurrentIndex(0);
          setMasteredInSession({});
          setAheadCards(savedCards);
          setDueMessage(savedCards.length && !availableSaved.cards.length ? 'Your saved cards are scheduled for later. Practise early if you want another round.' : '');
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
  }, [authLoading, token, user?.id]);

  useEffect(() => {
    setTopicId('');
    setTopics([]);
    if (!subjectId || !classId) return;
    let cancelled = false;
    setTopicsLoading(true);
    (async () => {
      const { data, error } = await getSupabase().from('topics')
        .select('id,name,term_id')
        .eq('subject_id', subjectId)
        .eq('class_id', classId)
        .eq('is_active', true)
        .order('name')
        .limit(500);
      if (!cancelled) {
        if (error) setError(error.message || 'Unable to load topics.');
        else {
          const unique = new Map<string, Topic>();
          for (const row of (data || []) as Topic[]) {
            const key = [row.name.trim().toLowerCase(), row.term_id].join(':');
            if (key && !unique.has(key)) unique.set(key, row);
          }
          setTopics([...unique.values()]);
        }
        setTopicsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subjectId, classId]);

  const startSession = (cards: Flashcard[]) => {
    setFlashcards(cards);
    setStudyOrder(cards.map((_, index) => index));
    setCurrentIndex(0);
    setMasteredInSession({});
    setIsFlipped(false);
  };

  const loadPrebuilt = async () => {
    if (!subjectId || loadingCards || !user?.id) return;
    setLoadingCards(true);
    setError('');
    setDueMessage('');
    try {
      // Fetch additional candidates, then select only cards currently due or new.
      const candidates = await fetchPrebuiltFlashcards({
        subjectId,
        classId: classId || undefined,
        topicId: topicId || undefined,
        limit: Math.min(100, cardCount * 4),
      });
      if (!candidates.length) throw new Error('No ready-made flashcards are available for this selection yet.');
      const setIds = [...new Set(candidates.map(c => parseFlashcardId(c.id)?.flashcard_id).filter((id): id is string => Boolean(id)))];
      const reviewMap: Record<string, ReviewState> = {};
      if (setIds.length) {
        const { data, error: reviewError } = await getSupabase()
          .from('flashcard_reviews')
          .select('flashcard_id,card_index,ease_factor,interval_days,next_review_at,reviews_count,last_answer_correct')
          .eq('user_id', user.id)
          .in('flashcard_id', setIds);
        if (reviewError) throw new Error(reviewError.message);
        for (const item of data || []) {
          reviewMap[`${item.flashcard_id}:${item.card_index}`] = {
            ease_factor: Number(item.ease_factor) || 2.5,
            interval_days: Number(item.interval_days) || 0,
            next_review_at: item.next_review_at,
            reviews_count: Number(item.reviews_count) || 0,
            last_answer_correct: item.last_answer_correct,
          };
        }
      }
      setReviews(reviewMap);
      const due = selectDueFlashcards(candidates, reviewMap, cardCount);
      setAheadCards(candidates);
      startSession(due.cards);
      setDueMessage(due.cards.length
        ? `Ready to review: ${due.cards.length} new or due cards. ${due.futureCount} already scheduled for later.`
        : due.nextDueAt
          ? `You're caught up with this selection. Your next review is ${new Date(due.nextDueAt).toLocaleString()}.`
          : 'There are no reviewable cards in this selection.');
    } catch (e: any) {
      setError(e?.message || 'Unable to load prebuilt flashcards.');
    } finally {
      setLoadingCards(false);
    }
  };

  const reviewAhead = () => {
    if (!aheadCards.length) return;
    const selected = selectDueFlashcards(aheadCards, reviews, cardCount, Date.now(), true);
    startSession(selected.cards);
    setDueMessage('Optional early practice. Future review dates will update when you rate a card.');
  };

  const saveReview = async (row: Record<string, unknown>) => {
    setSyncing(value => value + 1);
    try {
      const { error: saveError } = await getSupabase()
        .from('flashcard_reviews')
        .upsert(row, { onConflict: 'flashcard_id,card_index,user_id' });
      if (saveError) throw saveError;
    } catch {
      // Do not silently claim cloud persistence. Keep unsuccessful records retryable.
      setFailedWrites(pending => [...pending.filter(item =>
        item.flashcard_id !== row.flashcard_id || item.card_index !== row.card_index), row]);
    } finally {
      setSyncing(value => Math.max(0, value - 1));
    }
  };

  const retryFailed = async () => {
    const pending = failedWrites;
    setFailedWrites([]);
    for (const row of pending) await saveReview(row);
  };

  const rate = (rating: RecallRating) => {
    if (!isFlipped || !user?.id) return;
    const current = flashcards[studyOrder[currentIndex]];
    const identity = current && parseFlashcardId(current.id);
    if (!current || !identity) {
      setError('This card has no stable review ID, so the rating cannot be saved.');
      return;
    }
    const next = scheduleFlashcard(reviews[current.id], rating);
    setReviews(prev => ({ ...prev, [current.id]: next }));
    if (rating === 'hard') {
      // Return missed cards to the end of this session, rather than marking them mastered.
      setStudyOrder(prev => [...prev, prev[currentIndex]]);
    } else {
      setMasteredInSession(prev => ({ ...prev, [current.id]: true }));
    }
    setCurrentIndex(value => value + 1);
    setIsFlipped(false);
    void saveReview({
      ...identity,
      user_id: user.id,
      ...next,
      updated_at: new Date().toISOString(),
    });
  };

  const skip = () => {
    if (currentIndex >= studyOrder.length) return;
    setStudyOrder(prev => [...prev, prev[currentIndex]]);
    setCurrentIndex(value => value + 1);
    setIsFlipped(false);
  };

  if (authLoading || loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  const current = flashcards[studyOrder[currentIndex]];
  const progress = flashcards.length ? Math.min(100, Math.round(Object.keys(masteredInSession).length / flashcards.length * 100)) : 0;
  const sessionFinished = flashcards.length > 0 && currentIndex >= studyOrder.length;

  return <div className="space-y-6">
    <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200 dark:bg-[#1b2045] dark:ring-slate-700">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-700 dark:text-brand-300">Adaptive review • Saved to your account</p>
      <h1 className="mt-2 text-2xl font-extrabold text-[#151A3A] dark:text-white">Flashcards</h1>
      <p className="mt-2 max-w-3xl text-slate-500 dark:text-slate-300">Study ready-made cards from the published curriculum. The cards are already stored, so opening a set does not wait for AI generation.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-brand-50 p-4 dark:bg-[#151A3A]"><b className="text-[#151A3A] dark:text-white">Known / still learning</b><p className="mt-1 text-sm text-slate-500">Hard repeats in this session; Good and Easy schedule later review.</p></div><div className="rounded-2xl bg-brand-50 p-4 dark:bg-[#151A3A]"><b className="text-[#151A3A] dark:text-white">Fast subject sets</b><p className="mt-1 text-sm text-slate-500">Mix lessons, then study cards due for review.</p></div><div className="rounded-2xl bg-brand-50 p-4 dark:bg-[#151A3A]"><b className="text-[#151A3A] dark:text-white">Tap to reveal</b><p className="mt-1 text-sm text-slate-500">Keep revision simple on phones.</p></div></div>
    </header>

    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045]">
      <div className="mb-4 flex items-center gap-3"><LibraryBig className="h-5 w-5 text-brand-600"/><h2 className="font-bold text-[#151A3A] dark:text-white">Ready-made curriculum flashcards</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <select aria-label="Subject" value={subjectId} onChange={e => { setSubjectId(e.target.value); setClassId(''); setTopicId(''); }} className="min-w-0 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value="">Select a subject</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
        <select aria-label="Class level" value={classId} onChange={e => { setClassId(e.target.value); setTopicId(''); }} disabled={!subjectId} className="min-w-0 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white disabled:opacity-50"><option value="">All classes · mixed revision</option>{schoolClasses.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select aria-label="Curriculum topic" value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!subjectId || !classId || topicsLoading} className="min-w-0 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-stone-50 disabled:text-slate-400 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value="">{topicsLoading ? 'Loading topics…' : classId ? 'All topics in this class' : 'Select a class to narrow by topic'}</option>{topics.map(topic => <option key={topic.id} value={topic.id}>{topic.name} · {terms.find(term => term.id === topic.term_id)?.name || 'Term'}</option>)}</select>
        <select value={cardCount} onChange={e => setCardCount(Number(e.target.value))} aria-label="Review card count" className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-[#151A3A] dark:text-white"><option value={10}>10 cards</option><option value={20}>20 cards</option><option value={30}>30 cards</option></select>
        <button onClick={() => void loadPrebuilt()} disabled={!subjectId || loadingCards} className="rounded-xl bg-[#151A3A] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{loadingCards ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin"/>Loading cards…</> : `Open ${cardCount} cards`}</button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Choose a subject for a mixed revision set, or choose your exact class and term-labelled topic. Reviews are tracked separately for each signed-in student and scheduled for later practice.</p>
      {dueMessage && <p className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-slate-700 dark:bg-[#151A3A] dark:text-slate-200" role="status">{dueMessage}</p>}
      {aheadCards.length > 0 && flashcards.length === 0 && <button type="button" onClick={reviewAhead} className="mt-3 rounded-xl border border-brand-300 px-4 py-2 text-sm font-semibold text-brand-800 dark:text-brand-300">Practise early anyway</button>}
      {failedWrites.length > 0 && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"><span>{failedWrites.length} review update(s) could not sync. Reconnect and retry; don't close this page before saving.</span><button type="button" onClick={() => void retryFailed()} className="rounded-lg bg-amber-900 px-3 py-2 font-semibold text-white">Retry saving</button></div>}
      {syncing > 0 && <p className="mt-2 text-xs text-slate-500" role="status">Saving {syncing} rating(s)…</p>}
    </section>

    {current ? <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#1b2045] sm:p-8">
      <div className="mb-5 flex items-center justify-between gap-4 text-sm text-slate-500"><span>Review {currentIndex + 1} of {studyOrder.length}</span><span className="truncate">{current.title || `${progress}% mastered`}</span></div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-slate-700"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }}/></div>
      <button type="button" onClick={() => setIsFlipped(v => !v)} aria-label={isFlipped ? 'Show question' : 'Reveal answer'} className="group relative min-h-[280px] w-full [perspective:1000px]"><div className="relative min-h-[280px] w-full transition-transform duration-500 [transform-style:preserve-3d]" style={{ transform: isFlipped ? 'rotateY(180deg)' : undefined }}><div className="absolute inset-0 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-brand-200 bg-brand-50 p-8 [backface-visibility:hidden] dark:border-brand-900 dark:bg-brand-950/30"><span className="mb-4 text-xs font-bold uppercase tracking-wider text-brand-600">Question</span><p className="max-w-3xl text-center text-lg font-semibold leading-8 text-slate-900 dark:text-white">{current.front}</p><span className="mt-5 text-xs text-slate-400">Tap to reveal answer</span></div><div className="absolute inset-0 flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-8 [backface-visibility:hidden] [transform:rotateY(180deg)] dark:border-emerald-900 dark:bg-emerald-950/30"><span className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-600">Answer</span><p className="max-w-3xl text-center text-lg leading-8 text-slate-900 dark:text-white">{current.back}</p></div></div></button>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => { setCurrentIndex(i => Math.max(0, i - 1)); setIsFlipped(false); }} disabled={currentIndex === 0} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-slate-700 disabled:opacity-40 dark:border-slate-600 dark:text-slate-200"><ChevronLeft className="mr-1 inline h-4 w-4"/>Previous</button>
        <div className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => rate('hard')} disabled={!isFlipped} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-40 dark:text-red-300">Hard · again</button>
          <button type="button" onClick={() => rate('good')} disabled={!isFlipped} className="rounded-xl border border-amber-200 px-4 py-2.5 text-sm text-amber-800 hover:bg-amber-50 disabled:opacity-40 dark:text-amber-300">Good · later</button>
          <button type="button" onClick={() => rate('easy')} disabled={!isFlipped} className="rounded-xl border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 hover:bg-emerald-50 disabled:opacity-40 dark:text-emerald-300">Easy · 3+ days</button>
        </div>
        <button type="button" onClick={skip} className="rounded-xl border border-stone-300 px-4 py-2.5 text-sm text-slate-700 dark:border-slate-600 dark:text-slate-200">Skip for now<ChevronRight className="ml-1 inline h-4 w-4"/></button>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-300" role="status"><Check className="mr-1 inline h-3 w-3"/>{progress}% mastered this session. Reveal the answer before rating.</p>
    </section> : sessionFinished ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950/30" role="status"><Check className="mx-auto mb-3 h-10 w-10 text-emerald-700"/><h2 className="text-xl font-bold text-slate-900 dark:text-white">Review session complete</h2><p className="mt-2 text-sm text-slate-700 dark:text-slate-200">You recalled {Object.keys(masteredInSession).length} of {flashcards.length} cards. Their next review dates have been scheduled.</p><button type="button" onClick={() => { setAheadCards([]); setDueMessage(''); startSession([]); }} className="mt-4 rounded-lg bg-[#151A3A] px-5 py-3 text-sm font-semibold text-white">Choose another session</button></section> : <section className="rounded-2xl border border-dashed border-stone-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#1b2045]"><BrainIcon className="mx-auto mb-4 h-12 w-12 text-stone-300"/><h3 className="font-semibold text-[#151A3A] dark:text-white">Choose what you want to revise</h3><p className="mt-2 text-sm text-slate-500">Select a subject above to open its already-prepared flashcards.</p></section>}
  </div>;
}
