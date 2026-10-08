import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const landing = fs.readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const dashboard = fs.readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const layout = fs.readFileSync(new URL('../src/app/dashboard/layout.tsx', import.meta.url), 'utf8');
const flashcards = fs.readFileSync(new URL('../src/app/dashboard/flashcards/page.tsx', import.meta.url), 'utf8');

test('public homepage gives students clear exam-body and study-mode entry points', () => {
  assert.match(landing, /Choose exam body/);
  assert.match(landing, /JAMB \/ UTME/);
  assert.match(landing, /WAEC/);
  assert.match(landing, /NECO/);
  assert.match(landing, /NABTEB/);
  assert.match(landing, /CBT setup/);
  assert.match(landing, /Flashcards/);
  assert.match(landing, /Review wrong answers/);
  assert.doesNotMatch(landing, /SEO|content inventory|database limit|development status|future content plan/i);
});

test('learner dashboard prioritises return visits and critical exam actions', () => {
  assert.match(dashboard, /Start focused session/);
  assert.match(dashboard, /Continue last CBT/);
  assert.match(dashboard, /Review wrong answers/);
  assert.match(dashboard, /Daily practice/);
  assert.match(dashboard, /Weak areas/);
  assert.match(dashboard, /href: '\/dashboard\/jamb'/);
  assert.match(dashboard, /href: '\/dashboard\/flashcards'/);
});

test('mobile dashboard navigation keeps high-frequency learning actions near the top', () => {
  assert.match(layout, /label: 'JAMB'/);
  assert.match(layout, /label: 'School Exams'/);
  assert.match(layout, /label: 'Flashcards'/);
  assert.match(layout, /aria-label="Toggle navigation"/);
  assert(layout.indexOf("label: 'JAMB'") < layout.indexOf("label: 'Courses'"));
});

test('flashcards remain fast prebuilt revision instead of waiting on AI generation', () => {
  assert.match(flashcards, /ready-made cards/i);
  assert.match(flashcards, /already stored/i);
  assert.match(flashcards, /Open \$\{cardCount\} cards/);
  assert.doesNotMatch(flashcards, /generate flashcards/i);
});
