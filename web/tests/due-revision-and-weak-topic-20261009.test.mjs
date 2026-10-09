import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const get = relative => fs.readFileSync(new URL(relative, import.meta.url), 'utf8');
const service = get('../src/services/api/aiService.ts');
const flashcards = get('../src/app/dashboard/flashcards/page.tsx');
const progress = get('../src/app/dashboard/progress/page.tsx');

const js = ts.transpileModule(get('../src/lib/flashcardReview.ts'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { scheduleFlashcard, selectDueFlashcards } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);

test('older reviewed cards are retrieved before newest curriculum decks', () => {
  const due = service.indexOf(".from('flashcard_reviews')", service.indexOf('export const fetchPrebuiltFlashcards'));
  const latest = service.indexOf(".order('created_at', { ascending: false })", due);
  assert.ok(due >= 0 && latest > due, 'Due history must be checked before sampling latest decks');
  assert.match(service, /\.eq\('user_id', params\.userId\)/);
  assert.match(service, /\.lte\('next_review_at', new Date\(\)\.toISOString\(\)\)/);
  assert.match(service, /\.order\('next_review_at', \{ ascending: true \}\)/);
  assert.match(service, /start \+= 60/); // Safe request-size bound
  assert.match(service, /if \(selected\.length >= limit\) return selected/);
});

test('due and new-card composition is ID-stable, deduplicated, and class-scoped', () => {
  assert.match(service, /const used = new Set<string>\(\)/);
  assert.match(service, /if \(used\.has\(id\)\) return false/);
  assert.match(service, /\.eq\('class_id', params\.classId\)/);
  assert.match(service, /\.in\('topic_id', allowedTopicIds\)/);
  assert.match(service, /if \(params\.topicId && allowedTopicIds && !allowedTopicIds\.includes\(params\.topicId\)\) return \[\]/);
  assert.match(flashcards, /userId: user\.id/);
});

test('due reviews have priority over fresh cards in the pure scheduler', () => {
  const now = Date.UTC(2026, 9, 9, 10);
  const overdue = scheduleFlashcard(undefined, 'good', now - 3 * 86400000);
  const future = scheduleFlashcard(undefined, 'easy', now);
  const result = selectDueFlashcards(
    [{ id: 'new' }, { id: 'future' }, { id: 'overdue' }],
    { future, overdue },
    2,
    now,
  );
  assert.deepEqual(result.cards.map(row => row.id), ['overdue', 'new']);
  assert.equal(result.futureCount, 1);
});

test('weak topics return the learner to the matching subject and class', () => {
  assert.match(progress, /\/dashboard\/flashcards\?topic=/);
  assert.match(progress, /encodeURIComponent\(topic\.topicId\)/);
  assert.match(flashcards, /new URLSearchParams\(window\.location\.search\)\.get\('topic'\)/);
  assert.match(flashcards, /\.eq\('id', topic\)/);
  assert.match(flashcards, /setRequestedTopicId\(data\.id\)/);
  assert.match(flashcards, /setClassId\(data\.class_id\)/);
  assert.match(flashcards, /available\.some\(row => row\.id === requestedTopicId\)/);
});

test('recall UI avoids inaccessible 3D flips and endless skips', () => {
  assert.doesNotMatch(flashcards, /rotateY\(180deg\)|perspective:1000px/);
  assert.match(flashcards, /aria-pressed=\{isFlipped\}/);
  assert.match(flashcards, /focus-visible:outline/);
  assert.match(flashcards, /whitespace-pre-wrap break-words/);
  assert.match(flashcards, /!deferredCards\[identity\]/);
  assert.match(flashcards, /reviewedIndices\[currentIndex\]/);
  assert.match(flashcards, /setMasteredInSession\(prev => \{/);
});

test('saves are serialised per student and card and visibly retry failures', () => {
  assert.match(flashcards, /reviewWriteQueue\.current\.get\(key\)/);
  assert.match(flashcards, /reviewWriteQueue\.current\.set\(key, pending\)/);
  assert.match(flashcards, /\.upsert\(row, \{ onConflict: 'flashcard_id,card_index,user_id' \}\)/);
  assert.match(flashcards, /setFailedWrites\(/);
  assert.match(flashcards, /Retry saving/);
  assert.match(flashcards, /syncing > 0 \|\| failedWrites\.length > 0/);
});

test('progress results provide legible dark-scheme affordances', () => {
  assert.match(progress, /dark:bg-\[#1b2045\]/);
  assert.match(progress, /dark:text-slate-100/);
  assert.match(progress, /Revise this topic →/);
});
