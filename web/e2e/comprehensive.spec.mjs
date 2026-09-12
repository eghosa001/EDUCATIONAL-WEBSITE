import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const APP_ROOT = path.resolve(process.cwd(), 'src/app');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const AUTH_EMAIL = process.env.TEST_EMAIL;
const AUTH_PASSWORD = process.env.TEST_PASSWORD;
const MAX_CRAWL = Number(process.env.MAX_CRAWL || 250);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function routeFromPageFile(file) {
  const rel = path.relative(APP_ROOT, file).split(path.sep).join('/');
  if (!/(^|\/)page\.(tsx|ts|jsx|js)$/.test(rel)) return null;
  let route = rel.replace(/(^|\/)page\.(tsx|ts|jsx|js)$/, '');
  route = route.split('/').filter(Boolean).filter(s => !(s.startsWith('(') && s.endsWith(')'))).join('/');
  return route ? '/' + route : '/';
}

function isDynamic(route) { return /\[[^\]]+\]/.test(route); }
function normalize(url) {
  const u = new URL(url, BASE);
  u.hash = '';
  if (u.pathname !== '/' && u.pathname.endsWith('/')) u.pathname = u.pathname.slice(0, -1);
  return u.pathname + u.search;
}
function isInternal(href) {
  try { return new URL(href, BASE).origin === new URL(BASE).origin; } catch { return false; }
}
function isRisky(label) {
  return /\b(delete|remove|logout|sign out|pay|purchase|subscribe|cancel|submit|save|create|enroll|start exam|finish|generate|reset|send|post|publish)\b/i.test(label);
}

async function waitForSettledDocument(page) {
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  let previousUrl = page.url();
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(250);
    const currentUrl = page.url();
    if (currentUrl === previousUrl) return;
    previousUrl = currentUrl;
    await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
  }
}

async function inspectRenderedDocument(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await page.evaluate(() => {
        const bodyText = document.body?.innerText?.trim() || '';
        const images = Array.from(document.querySelectorAll('img')).filter(img => {
          const style = window.getComputedStyle(img);
          const rect = img.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        }).map(img => ({ complete: img.complete, naturalWidth: img.naturalWidth, src: img.currentSrc || img.src }));
        return {
          bodyText,
          images,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
    } catch (error) {
      if (attempt === 2) throw error;
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(250);
    }
  }
  throw new Error('Unable to inspect settled document');
}

const pageFiles = walk(APP_ROOT).filter(f => /\/page\.(tsx|ts|jsx|js)$/.test(f));
const routes = [...new Set(pageFiles.map(routeFromPageFile).filter(Boolean))];
const staticRoutes = routes.filter(r => !isDynamic(r));
const dynamicRoutes = routes.filter(isDynamic);

test.describe('THE GUIDE comprehensive route and UI smoke suite', () => {
  test('route inventory contains every Next.js screen', async () => {
    expect(pageFiles.length).toBeGreaterThan(0);
    expect(routes.length).toBe(pageFiles.length);
    expect(routes).toContain('/');
    expect(routes).toContain('/login');
    for (const route of dynamicRoutes) expect(route).toMatch(/\[[^\]]+\]/);
  });

  for (const route of staticRoutes) {
    test(`screen renders without fatal errors: ${route}`, async ({ page }) => {
      const fatal = [];
      page.on('pageerror', err => fatal.push(`pageerror: ${err.message}`));
      page.on('console', msg => {
        if (msg.type() === 'error' && /Unhandled Runtime Error|Hydration failed|ChunkLoadError/i.test(msg.text())) fatal.push(`console: ${msg.text()}`);
      });
      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 });
      expect(response, `No response for ${route}`).not.toBeNull();
      expect(response.status(), `${route} returned HTTP ${response.status()}`).toBeLessThan(500);
      await waitForSettledDocument(page);
      const snapshot = await inspectRenderedDocument(page);
      expect(snapshot.bodyText.length, `${route} appears blank`).toBeGreaterThan(10);
      expect(snapshot.bodyText).not.toMatch(/Application error: a client-side exception has occurred/i);
      expect(fatal, `Fatal browser errors on ${route}`).toEqual([]);
      for (const image of snapshot.images) {
        expect(image.complete, `Image did not finish loading on ${route}: ${image.src}`).toBe(true);
        expect(image.naturalWidth, `Broken image on ${route}: ${image.src}`).toBeGreaterThan(0);
      }
      expect(snapshot.overflow, `Horizontal overflow on ${route}`).toBeLessThanOrEqual(8);
    });
  }

  test('public-site link crawl finds no broken internal links', async ({ page, request }) => {
    const queue = ['/'];
    const seen = new Set();
    const failures = [];
    while (queue.length && seen.size < MAX_CRAWL) {
      const route = queue.shift();
      const key = normalize(route);
      if (seen.has(key)) continue;
      seen.add(key);
      const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      if (!response || response.status() >= 500) { failures.push(`${route} -> ${response?.status() ?? 'navigation failed'}`); continue; }
      await waitForSettledDocument(page);
      for (const href of await page.locator('a[href]').evaluateAll(as => as.map(a => a.getAttribute('href')).filter(Boolean))) {
        if (!isInternal(href)) continue;
        const target = new URL(href, BASE);
        if (target.pathname.startsWith('/api/')) continue;
        const normalized = normalize(target.href);
        if (!seen.has(normalized)) queue.push(normalized);
        if (!target.pathname.includes('[')) {
          const head = await request.get(target.href, { timeout: 15000 }).catch(() => null);
          if (!head || head.status() >= 500) failures.push(`${target.pathname} -> ${head?.status() ?? 'request failed'}`);
        }
      }
    }
    expect(failures, `Broken internal links (checked ${seen.size} routes)`).toEqual([]);
  });

  test('safe interactive controls respond without uncaught browser errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForSettledDocument(page);
    const buttons = page.locator('button:visible');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const label = ((await button.innerText().catch(() => '')) || (await button.getAttribute('aria-label')) || '').trim().replace(/\s+/g, ' ');
      if (!label || isRisky(label) || !(await button.isEnabled())) continue;
      await button.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(150);
    }
    expect(errors, 'Uncaught browser errors after safe UI interactions').toEqual([]);
  });

  test('mobile layouts render without horizontal overflow', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const page = await context.newPage();
    for (const route of staticRoutes.slice(0, 30)) {
      await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      await waitForSettledDocument(page);
      const snapshot = await inspectRenderedDocument(page);
      expect(snapshot.overflow, `Mobile horizontal overflow on ${route}`).toBeLessThanOrEqual(8);
    }
    await context.close();
  });

  test('authenticated dashboard navigation works when credentials are supplied', async ({ page }) => {
    test.skip(!AUTH_EMAIL || !AUTH_PASSWORD, 'Set TEST_EMAIL and TEST_PASSWORD to run authenticated coverage.');
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByLabel('Email').fill(AUTH_EMAIL);
    await page.getByLabel('Password').fill(AUTH_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    const hrefs = [...new Set(await page.locator('nav a[href^="/dashboard"]').evaluateAll(as => as.map(a => a.getAttribute('href')).filter(Boolean)))];
    for (const href of hrefs) {
      const response = await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
      expect(response?.status() ?? 599).toBeLessThan(500);
      await waitForSettledDocument(page);
      const snapshot = await inspectRenderedDocument(page);
      expect(snapshot.bodyText.length).toBeGreaterThan(10);
    }
    expect(errors).toEqual([]);
  });
});
