import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REPO_ROOT = path.resolve(ROOT, '..');
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

test('analytics privileged datasets remain administrator-only', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'supabase', 'functions', 'analytics', 'index.ts'), 'utf8');
  assert.match(source, /adminOnlyActions/);
  assert.match(source, /Administrator access required/);
  assert.match(source, /roles\(name\)/);
});

test('lesson worker requires its private worker token', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'supabase', 'functions', 'lesson-worker', 'index.ts'), 'utf8');
  assert.match(source, /x-worker-token/);
  assert.match(source, /requireWorkerToken/);
  assert.match(source, /internal_worker_auth/);
});

test('paid subscriptions are not activated before payment', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'supabase', 'functions', 'payments', 'index.ts'), 'utf8');
  assert.match(source, /if \(price > 0\) return json/);
  assert.match(source, /paymentRequired:\s*true/);
  assert.doesNotMatch(source, /status:\s*'trialing'.*insert/s);
});

test('obsolete lesson regenerator is fail-closed', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'backend', 'scripts', 'ai-regenerate-lessons.js'), 'utf8');
  assert.match(source, /intentionally disabled/);
  assert.match(source, /process\.exit\(1\)/);
  assert.doesNotMatch(source, /from\('lessons'\)\.update/);
});

test('subscription named routes are declared before the dynamic id route and legacy webhook is absent', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'backend', 'src', 'routes', 'subscription.routes.js'), 'utf8');
  const dynamicIndex = source.indexOf("subscriptionRoutes.get('/:id'");
  assert.ok(dynamicIndex > 0, 'dynamic subscription route is missing');
  for (const route of ["get('/access'", "get('/invoices'", "get('/wallet'", "get('/wallet/transactions'"]) {
    const index = source.indexOf(`subscriptionRoutes.${route}`);
    assert.ok(index >= 0 && index < dynamicIndex, `${route} must be declared before /:id`);
  }
  assert.doesNotMatch(source, /webhook\/:gateway/);
});

test('admin billing collection and wallet funding routes require administrator roles', () => {
  const routes = fs.readFileSync(path.join(REPO_ROOT, 'backend', 'src', 'routes', 'subscription.routes.js'), 'utf8');
  const controller = fs.readFileSync(path.join(REPO_ROOT, 'backend', 'src', 'subscriptions', 'controllers', 'subscription.controller.js'), 'utf8');
  assert.match(routes, /subscriptionRoutes\.get\('\/'[\s\S]*?requireRole\('admin', 'super_admin'\)[\s\S]*?listAllSubscriptions/);
  assert.match(routes, /subscriptionRoutes\.post\('\/wallet\/fund'[\s\S]*?requireRole\('admin', 'super_admin'\)[\s\S]*?fundWalletForUser/);
  assert.match(controller, /targetUserIdForAdminQuery/);
  assert.match(controller, /Administrator access required/);
  assert.match(controller, /numericAmount <= 0/);
  assert.match(controller, /creditWalletBalance/);
});

test('paid plan page uses verified backend payment checkout rather than activating a paid subscription directly', () => {
  const page = fs.readFileSync(path.join(ROOT, 'src', 'app', 'dashboard', 'subscriptions', 'plans', 'page.tsx'), 'utf8');
  assert.match(page, /createPayment\(/);
  assert.match(page, /Continue to secure payment/);
  assert.match(page, /authorizationUrl/);
  assert.match(page, /price <= 0/);
});

test('subscription controller enforces ownership and blocks direct paid activation', () => {
  const source = fs.readFileSync(path.join(REPO_ROOT, 'backend', 'src', 'subscriptions', 'controllers', 'subscription.controller.js'), 'utf8');
  assert.match(source, /subscription\.user_id !== req\.user\.id/);
  assert.match(source, /Paid subscriptions must be started through the secure payment checkout/);
  assert.match(source, /Paid renewals must be started through the secure payment checkout/);
});
