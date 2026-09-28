import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('learner question API excludes generic filler and never exposes stored PDFs', () => {
  const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
  assert.match(api, /THE GUIDE Curriculum Practice/);
  assert.doesNotMatch(api, /past-question-files/);
  const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /publicUrl|Original source papers|\.pdf/);
  assert.match(page, /\/past-questions\?/);
});

test('visible branding uses the supplied raster artwork directly', () => {
  const brand = fs.readFileSync(new URL('../src/components/BrandLogo.tsx', import.meta.url), 'utf8');
  assert.match(brand, /primary-logo\.jfif/);
  assert.match(brand, /dark-mode-silver\.jfif/);
  assert.match(brand, /data-brand-logo/);
  assert.doesNotMatch(brand, /the-guide-mark/);
});
