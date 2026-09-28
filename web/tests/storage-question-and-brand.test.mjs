import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('learner question API excludes generic objective filler and exposes stored source papers', () => {
  const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
  assert.match(api, /THE GUIDE Curriculum Practice/);
  assert.match(api, /past-question-files/);
  assert.match(api, /past_question_files/);
});

test('visible branding uses the supplied light and dark logo artwork', () => {
  const brand = fs.readFileSync(new URL('../src/components/BrandLogo.tsx', import.meta.url), 'utf8');
  assert.match(brand, /primary-logo\.jfif/);
  assert.match(brand, /dark-mode-silver\.jfif/);
  assert.doesNotMatch(brand, /the-guide-mark/);
  assert.match(brand, /object-cover object-center/);
});
