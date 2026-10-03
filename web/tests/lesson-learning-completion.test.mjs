import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('lesson page renders GFM tables and a visual concept map', () => {
  const page = read('../src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx');
  assert.match(page, /remarkGfm/);
  assert.match(page, /LessonVisualMap/);
  assert.match(page, /<table className=/);
});

test('lesson practice is cached and has a grounded fallback', () => {
  const fn = read('../../supabase/functions/lesson-practice/index.ts');
  assert.match(fn, /lesson_practice_sets/);
  assert.match(fn, /groundedFallback/);
  assert.match(fn, /must vary correct-answer positions/);
  assert.match(fn, /Do not ask learners to identify a learning objective/);
});

test('legacy objective-recognition practice is excluded', () => {
  const page = read('../src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx');
  const migration = read('../../supabase/migrations/20261003102500_complete_learning_experience.sql');
  assert.match(page, /THE GUIDE Curriculum Practice/);
  assert.match(migration, /source = 'THE GUIDE Curriculum Practice'/);
  assert.match(migration, /set is_active = false/);
});
