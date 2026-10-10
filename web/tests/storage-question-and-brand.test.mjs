import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('learner question API excludes generic filler and never exposes stored PDFs', () => {
  const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
  assert.match(api, /THE GUIDE Curriculum Practice/);
  assert.doesNotMatch(api, /past-question-files/);
  const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(page, /publicUrl|Original source papers|\.pdf/);
  assert.match(page, /\/past-questions\/session/);
  assert.match(page, /\/past-questions\/grade/);
});

test('transparent shared brand reuses the supplied artwork without a rectangular raster backdrop', () => {
  const brand = fs.readFileSync(new URL('../src/components/BrandLogo.tsx', import.meta.url), 'utf8');
  assert.match(brand, /dark-mode-silver\\.jfif/);
  assert.match(brand, /feColorMatrix/);
  assert.match(brand, /maskType: 'alpha'/);
  assert.match(brand, /data-brand-logo/);
  assert.match(brand, /dark:fill-/);
  assert.doesNotMatch(brand, /<img|mix-blend|the-guide-mark/);
});
