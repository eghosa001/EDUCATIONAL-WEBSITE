import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const landing = fs.readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const exams = fs.readFileSync(new URL('../src/app/dashboard/exams/page.tsx', import.meta.url), 'utf8');
const jamb = fs.readFileSync(new URL('../src/app/dashboard/jamb/page.tsx', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../src/app/dashboard/layout.tsx', import.meta.url), 'utf8');
const flashcards = fs.readFileSync(new URL('../src/app/dashboard/flashcards/page.tsx', import.meta.url), 'utf8');

test('public homepage is a student-first exam journey, not a generic brochure', () => {
  for (const text of ['Choose exam body', 'Subject selection', 'Question count', 'Timed or untimed', 'Score review', 'Recently viewed', 'Saved questions']) {
    assert.match(landing, new RegExp(text));
  }
  for (const board of ['JAMB / UTME', 'WAEC', 'NECO', 'NABTEB']) assert.match(landing, new RegExp(board));
  assert.doesNotMatch(landing, /SEO|content inventory|database limit|development status|future content plan/i);
});

test('learner dashboard prioritises high-retention next actions', () => {
  for (const text of ['Next best step', 'Continue last CBT', 'Daily practice', 'Weak-topic review', 'Recently viewed', 'Saved questions', 'Review wrong answers']) {
    assert.match(dashboard, new RegExp(text));
  }
  assert.match(dashboard, /href="\/dashboard\/jamb"/);
  assert.match(dashboard, /href="\/dashboard\/flashcards"/);
});

test('school exams page gives a compact four-step journey and keeps boards separate', () => {
  for (const text of ['Exam journey', 'Select board', 'Select subject', 'Choose question count', 'Submit and review', 'No board mixing']) {
    assert.match(exams, new RegExp(text));
  }
  assert.match(exams, /Go to JAMB/);
});

test('JAMB hub explains the four-subject CBT setup before starting', () => {
  for (const text of ['JAMB 4-step CBT setup', 'Subject combination', 'Question count', 'Timer', 'Score review']) {
    assert.match(jamb, new RegExp(text));
  }
  assert.match(jamb, /exactly four subjects/i);
});

test('mobile navigation keeps high-frequency learning actions near the top', () => {
  assert.match(layout, /label: 'JAMB'/);
  assert.match(layout, /label: 'School Exams'/);
  assert.match(layout, /label: 'Flashcards'/);
  assert.match(layout, /aria-label="Toggle navigation"/);
  assert(layout.indexOf("label: 'JAMB'") < layout.indexOf("label: 'Courses'"));
});

test('flashcards read as fast spaced revision, not slow AI generation', () => {
  for (const text of ['ready-made cards', 'already stored', 'Known / still learning', 'No AI wait', 'Spaced review']) {
    assert.match(flashcards, new RegExp(text, 'i'));
  }
  assert.doesNotMatch(flashcards, /generate flashcards/i);
});
