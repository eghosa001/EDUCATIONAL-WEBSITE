import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, 'src', 'app');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function routeFromPage(file) {
  const rel = path.relative(APP_ROOT, file).split(path.sep).join('/');
  let route = rel.replace(/\/page\.(tsx|ts|jsx|js)$/, '');
  route = route.split('/').filter(Boolean).filter(segment => !(segment.startsWith('(') && segment.endsWith(')'))).join('/');
  return route ? `/${route}` : '/';
}

test('every Next.js page has one unique route and a default export', () => {
  const pages = walk(APP_ROOT).filter(file => /page\.(tsx|ts|jsx|js)$/.test(file));
  assert.ok(pages.length > 20, `expected a substantial screen inventory, found ${pages.length}`);
  const routes = pages.map(routeFromPage);
  assert.equal(new Set(routes).size, routes.length, 'duplicate route mapping detected');
  for (const file of pages) {
    const source = fs.readFileSync(file, 'utf8');
    assert.match(source, /export\s+default\s+/, `${path.relative(ROOT, file)} is missing a default export`);
  }
});

test('Playwright is installed as a real project dependency', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.devDependencies?.['@playwright/test'], '1.55.0');
  assert.equal(pkg.scripts?.['test:e2e'], 'playwright test');
});

test('public Supabase storage helper has no hard-coded project host', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src', 'api', 'past-questions', 'files.ts'), 'utf8');
  assert.doesNotMatch(source, /https:\/\/[a-z0-9]+\.supabase\.co/i);
  assert.match(source, /NEXT_PUBLIC_SUPABASE_URL is required/);
});

test('web source contains no committed private-key shaped values', () => {
  const files = walk(path.join(ROOT, 'src')).filter(file => /\.(ts|tsx|js|jsx|mjs)$/.test(file));
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['\"][^'\"]+['\"]/i, path.relative(ROOT, file));
    assert.doesNotMatch(source, /sk_live_[A-Za-z0-9]+/, path.relative(ROOT, file));
  }
});
