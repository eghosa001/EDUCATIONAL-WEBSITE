import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('transparent shared brand reuses the supplied artwork without a rectangular raster backdrop', () => {
  const brand = fs.readFileSync(new URL('../src/components/BrandLogo.tsx', import.meta.url), 'utf8');
  assert.ok(brand.includes('/logos/dark-mode-silver.jfif'));
  assert.match(brand, /feColorMatrix/);
  assert.match(brand, /maskType: 'alpha'/);
  assert.match(brand, /data-brand-logo/);
  assert.match(brand, /dark:fill-/);
  assert.doesNotMatch(brand, /<img|mix-blend|the-guide-mark/);
});

test('auth screens no longer use generic book or user marks', () => {
  for (const file of ['LoginForm.tsx', 'RegisterForm.tsx']) {
    const source = fs.readFileSync(new URL('../src/features/auth/components/' + file, import.meta.url), 'utf8');
    assert.match(source, /BrandLogo/);
    assert.doesNotMatch(source, /mx-auto h-16 w-16 bg-blue-600 rounded-full/);
  }
});

test('timed past-question CBT excludes ungraded source questions', () => {
  const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
  const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
  assert.match(api, /path==='\/past-questions\/session'/);
  assert.match(api, /not\('correct_answer','is',null\)/);
  assert.match(api, /scalarAnswer\(row\.correct_answer\)/);
  assert.match(page, /past-questions\/session/);
});
