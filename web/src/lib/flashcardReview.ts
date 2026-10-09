/**
 * Small, deterministic spaced-repetition scheduler for existing flashcard_reviews.
 * "Hard" returns the card to the current study session and schedules it in ten minutes.
 * "Good" and "Easy" graduate the card to later dates. All progress persists on Supabase.
 */
export type RecallRating = 'hard' | 'good' | 'easy';

export interface ReviewState {
  ease_factor: number;
  interval_days: number;
  next_review_at: string;
  reviews_count: number;
  last_answer_correct: boolean | null;
}

export function parseFlashcardId(reference: string): { flashcard_id: string; card_index: number } | null {
  const colon = reference.lastIndexOf(':');
  if (colon < 0) return null;
  const flashcard_id = reference.slice(0, colon);
  const index = Number(reference.slice(colon + 1));
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(flashcard_id)
    || !Number.isSafeInteger(index) || index < 0) return null;
  return { flashcard_id, card_index: index };
}

export function scheduleFlashcard(
  prior: ReviewState | undefined,
  rating: RecallRating,
  now: number = Date.now(),
): ReviewState {
  const previousEase = Math.min(3.0, Math.max(1.3, Number(prior?.ease_factor) || 2.5));
  const previousInterval = Math.max(0, Math.floor(Number(prior?.interval_days) || 0));
  let easeFactor = previousEase;
  let intervalDays = 0;
  let nextAt: number;

  if (rating === 'hard') {
    easeFactor = Math.max(1.3, previousEase - 0.2);
    nextAt = now + 10 * 60 * 1000;
  } else if (rating === 'good') {
    intervalDays = !prior || !prior.last_answer_correct ? 1 : Math.min(365, Math.max(1, Math.round(previousInterval * previousEase)));
    nextAt = now + intervalDays * 24 * 60 * 60 * 1000;
  } else {
    easeFactor = Math.min(3.0, previousEase + 0.15);
    intervalDays = !prior || !prior.last_answer_correct ? 3 : Math.min(365, Math.max(3, Math.round(previousInterval * easeFactor * 1.3)));
    nextAt = now + intervalDays * 24 * 60 * 60 * 1000;
  }

  return {
    ease_factor: Number(easeFactor.toFixed(2)),
    interval_days: intervalDays,
    next_review_at: new Date(nextAt).toISOString(),
    reviews_count: Math.max(0, prior?.reviews_count || 0) + 1,
    last_answer_correct: rating !== 'hard',
  };
}

/** New or overdue cards first; hide cards due in the future from normal review. */
export function selectDueFlashcards<T extends { id: string }>(
  cards: T[],
  reviews: Record<string, ReviewState>,
  limit: number,
  now: number = Date.now(),
  allowAhead = false,
): { cards: T[]; nextDueAt: string | null; futureCount: number } {
  const unseen: T[] = [];
  const due: T[] = [];
  const future: T[] = [];
  for (const card of cards) {
    const record = reviews[card.id];
    if (!record || !Number.isFinite(Date.parse(record.next_review_at))) unseen.push(card);
    else if (Date.parse(record.next_review_at) <= now) due.push(card);
    else future.push(card);
  }
  due.sort((a, b) => Date.parse(reviews[a.id].next_review_at) - Date.parse(reviews[b.id].next_review_at));
  future.sort((a, b) => Date.parse(reviews[a.id].next_review_at) - Date.parse(reviews[b.id].next_review_at));
  return {
    cards: [...due, ...unseen, ...(allowAhead ? future : [])].slice(0, Math.max(0, limit)),
    nextDueAt: future.length ? reviews[future[0].id].next_review_at : null,
    futureCount: future.length,
  };
}
