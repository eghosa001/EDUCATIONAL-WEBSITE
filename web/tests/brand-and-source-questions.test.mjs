import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('brand component uses supplied THE GUIDE raster assets directly', () => {
  const brand = fs.readFileSync(new URL('../src/components/BrandLogo.tsx', import.meta.url), 'utf8');
  assert.match(brand, /primary-logo\.jfif/);
  assert.match(brand, /dark-mode-silver\.jfif/);
  assert.match(brand, /data-brand-logo/);
  assert.doesNotMatch(brand, /brand-light\.svg|brand-dark\.svg|the-guide-mark/);
});

test('auth screens no longer use generic book or user marks', () => {
  for (const file of ['LoginForm.tsx', 'RegisterForm.tsx']) {
    const source = fs.readFileSync(new URL('../src/features/auth/components/' + file, import.meta.url), 'utf8');
    assert.match(source, /BrandLogo/);
    assert.doesNotMatch(source, /mx-auto h-16 w-16 bg-blue-600 rounded-full/);
  }
});

test('ungraded source questions remain practice-only', () => {
  const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /current\.hasAnswer===false/);
  assert.match(page, /practice-only/);
});
