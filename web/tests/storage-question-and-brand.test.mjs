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
  const light = fs.readFileSync(new URL('../public/logos/brand-light.svg', import.meta.url), 'utf8');
  const dark = fs.readFileSync(new URL('../public/logos/brand-dark.svg', import.meta.url), 'utf8');
  assert.match(brand, /brand-light\.svg/);
  assert.match(brand, /brand-dark\.svg/);
  assert.match(light, /primary-logo\.jfif/);
  assert.match(dark, /dark-mode-silver\.jfif/);
  assert.doesNotMatch(brand, /the-guide-mark/);
  assert.match(brand, /object-contain/);
});
