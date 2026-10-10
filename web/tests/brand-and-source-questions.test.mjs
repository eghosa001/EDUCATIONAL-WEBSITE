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

test('brand remains readable on light and dark login, register and recovery screens', () => {
  for (const file of ['LoginForm.tsx', 'RegisterForm.tsx', 'ForgotPasswordForm.tsx', 'ResetPasswordForm.tsx']) {
    const source = fs.readFileSync(new URL('../src/features/auth/components/' + file, import.meta.url), 'utf8');
    assert.ok(source.includes('dark:bg-[#151A3A]'));
    assert.match(source, /dark:text-slate-100/);
    assert.match(source, /BrandLogo/);
  }
});

test('brand theme control is accessible on public, account and dashboard screens', () => {
  const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
  assert.match(read('../src/app/page.tsx'), /<ThemeToggle compact/);
  assert.match(read('../src/app/(auth)/layout.tsx'), /<ThemeToggle compact/);
  const dashboard = read('../src/app/dashboard/layout.tsx');
  assert.match(dashboard, /<ThemeToggle compact/);
  assert.match(dashboard, /Appearance<\/span><ThemeToggle \/>/);
});

test('brand theme button saves preference and updates the whole document', () => {
  const theme = fs.readFileSync(new URL('../src/contexts/ThemeContext.tsx', import.meta.url), 'utf8');
  assert.match(theme, /STORAGE_KEY = 'edu-theme'/);
  assert.match(theme, /window\.localStorage\.setItem\(STORAGE_KEY, next\)/);
  assert.match(theme, /document\.documentElement\.classList\.toggle\('dark'/);
  assert.match(theme, /aria-label=\{`Switch to \$\{next\} mode`\}/);
  assert.match(theme, /focus-visible:ring-2/);
});

test('timed past-question CBT excludes ungraded source questions', () => {
  const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
  const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
  assert.match(api, /path==='\/past-questions\/session'/);
  assert.match(api, /not\('correct_answer','is',null\)/);
  assert.match(api, /scalarAnswer\(row\.correct_answer\)/);
  assert.match(page, /past-questions\/session/);
});
