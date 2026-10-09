import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Execute the checked-in TypeScript scheduler rather than re-implement its
// logic inside the tests. This works under Node without a separate test runner.
const tsSource = fs.readFileSync(new URL('../src/lib/flashcardReview.ts', import.meta.url), 'utf8');
const javascript = ts.transpileModule(tsSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { parseFlashcardId, scheduleFlashcard, selectDueFlashcards } =
  await import('data:text/javascript;base64,' + Buffer.from(javascript).toString('base64'));

const point = Date.UTC(2026, 9, 9, 10, 0, 0);
const uuid = '123e4567-e89b-12d3-a456-426614174000';

test('card IDs preserve the actual JSONB card index within a set', () => {
  assert.deepEqual(parseFlashcardId(uuid + ':4'), { flashcard_id: uuid, card_index: 4 });
  for (const invalid of [uuid + ':-1', uuid + ':1.1', uuid + ':NaN', 'not-a-uuid:0', uuid]) {
    assert.equal(parseFlashcardId(invalid), null);
  }
});

test('Hard cards return in ten minutes rather than graduating', () => {
  const state = scheduleFlashcard(undefined, 'hard', point);
  assert.equal(state.interval_days, 0);
  assert.equal(state.last_answer_correct, false);
  assert.equal(state.next_review_at, new Date(point + 10 * 60000).toISOString());
  assert.equal(state.reviews_count, 1);
});

test('Good and Easy set different intervals and adapt to earlier reviews', () => {
  const good = scheduleFlashcard(undefined, 'good', point);
  const easy = scheduleFlashcard(undefined, 'easy', point);
  assert.equal(good.interval_days, 1);
  assert.equal(easy.interval_days, 3);
  const advanced = scheduleFlashcard(good, 'good', point + 86400000);
  assert.ok(advanced.interval_days > good.interval_days);
  assert.equal(advanced.reviews_count, 2);
  const failed = scheduleFlashcard(advanced, 'hard', point + 2 * 86400000);
  assert.equal(failed.interval_days, 0);
  const recovered = scheduleFlashcard(failed, 'good', point + 3 * 86400000);
  assert.equal(recovered.interval_days, 1);
});

test('new and due cards appear first; future cards wait unless early practice is requested', () => {
  const cards = [{ id: 'future' }, { id: 'new' }, { id: 'overdue' }];
  const records = {
    future: { next_review_at: new Date(point + 3 * 86400000).toISOString() },
    overdue: { next_review_at: new Date(point - 86400000).toISOString() },
  };
  const planned = selectDueFlashcards(cards, records, 10, point);
  assert.deepEqual(planned.cards.map(c => c.id), ['overdue', 'new']);
  assert.equal(planned.futureCount, 1);
  assert.deepEqual(
    selectDueFlashcards(cards, records, 10, point, true).cards.map(c => c.id),
    ['overdue', 'new', 'future'],
  );
});

test('the dashboard avoids full-tree prefetch and never activates dashboard for a subpage', () => {
  const layout = fs.readFileSync(new URL('../src/app/dashboard/layout.tsx', import.meta.url), 'utf8');
  assert.match(layout, /likelyDestinations/);
  assert.doesNotMatch(layout, /dashboardPrefetchRoutes/);
  assert.match(layout, /item\.href === '\/dashboard'/);
  assert.match(layout, /prefetch=\{false\}/);
  assert.match(layout, /connection\.connection\?\.saveData/);
});

test('scoped DB row-level security permits only own flashcard review writes', () => {
  const migration = fs.readFileSync(new URL('../../supabase/migrations/20261009235000_enable_owner_scoped_flashcard_reviews.sql', import.meta.url), 'utf8');
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(migration, /FOR INSERT TO authenticated/i);
  assert.match(migration, /FOR UPDATE TO authenticated/i);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /f\.is_public = true OR f\.created_by =/i);
});

test('flashcards use real persisted reviews, not only blind next-card advancement', () => {
  const page = fs.readFileSync(new URL('../src/app/dashboard/flashcards/page.tsx', import.meta.url), 'utf8');
  const service = fs.readFileSync(new URL('../src/services/api/aiService.ts', import.meta.url), 'utf8');
  for (const marker of ['scheduleFlashcard(', 'selectDueFlashcards(', 'flashcard_reviews', 'last_answer_correct', "rating === 'hard'", 'retryFailed']) {
    assert.ok(page.includes(marker), marker);
  }
  assert.doesNotMatch(page, /const rate = \(_rating:/);
  assert.match(service, /id: `\$\{set\.id\}:\$\{index\}`/);
  assert.match(service, /for \(let index = 0; selected\.length < limit;/);
  assert.match(service, /\.from\('flashcard_reviews'\)/);
  assert.match(service, /\.lte\('next_review_at'/);
});
