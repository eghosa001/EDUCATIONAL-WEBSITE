import { test, expect } from '@playwright/test';

const enabled = process.env.PRODUCTION_SMOKE === '1';
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const qaEmail = process.env.QA_EMAIL || '';
const qaPassword = process.env.QA_PASSWORD || '';

const fatalText = /Application error|Internal Server Error|FUNCTION_INVOCATION_FAILED|Route (GET|POST) .*not available|Failed to send a request to the Edge Function/i;

async function login(page) {
  expect(qaEmail, 'QA_EMAIL must be provisioned by the production workflow').toBeTruthy();
  expect(qaPassword, 'QA_PASSWORD must be provisioned by the production workflow').toBeTruthy();
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('Email address').fill(qaEmail);
  await page.getByPlaceholder('Password').fill(qaPassword);
  await page.getByRole('button', { name: /^Sign in$/i }).click();
  await page.waitForURL(/\/dashboard(?:\/|$)/, { timeout: 30000 });
}

function watchRuntimeFailures(page) {
  const failures = [];
  page.on('pageerror', error => failures.push(`pageerror: ${error.message}`));
  page.on('response', response => {
    const url = response.url();
    if (response.status() >= 500 && (url.includes('web-ogs7.vercel.app') || url.includes('xanrzsszrysianxhpprk.supabase.co'))) {
      failures.push(`${response.status()} ${response.request().method()} ${url}`);
    }
  });
  return failures;
}

async function expectHealthy(page, failures) {
  await expect(page.locator('body')).not.toContainText(fatalText);
  expect(failures, failures.join('\n')).toEqual([]);
}

async function accessToken(page) {
  return await page.evaluate(() => {
    const key = Object.keys(localStorage).find(item => item.startsWith('sb-') && item.endsWith('-auth-token'));
    const raw = key ? localStorage.getItem(key) : null;
    const value = raw ? JSON.parse(raw) : null;
    return value?.access_token || value?.currentSession?.access_token || value?.session?.access_token || '';
  });
}

async function expectBrandVisible(page) {
  const logo = page.locator('[data-brand-logo]:visible').first();
  await expect(logo).toBeVisible();
  const image = logo.locator('img:visible').first();
  await expect(image).toBeVisible();
  const state = await image.evaluate((img) => {
    const rect = img.getBoundingClientRect();
    const style = getComputedStyle(img);
    return {
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: rect.width,
      height: rect.height,
      opacity: Number(style.opacity || '1'),
      visibility: style.visibility,
      display: style.display,
    };
  });
  expect(state.complete).toBe(true);
  expect(state.naturalWidth).toBeGreaterThan(500);
  expect(state.naturalHeight).toBeGreaterThan(250);
  expect(state.width).toBeGreaterThan(100);
  expect(state.height).toBeGreaterThan(30);
  expect(state.opacity).toBeGreaterThan(0);
  expect(state.visibility).not.toBe('hidden');
  expect(state.display).not.toBe('none');
}

async function captureVisual(page, testInfo, name) {
  const safe = name.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home';
  const path = testInfo.outputPath(`visual-${safe}.png`);
  await page.screenshot({ path, fullPage: true, animations: 'disabled' });
  await testInfo.attach(`visual-${safe}`, { path, contentType: 'image/png' });
}

test.describe('deployed production public visual QA', () => {
  test.skip(!enabled, 'Production QA runs only after the Vercel deployment is ready.');
  for (const route of ['/', '/login', '/register', '/forgot-password', '/visual-404-check']) {
    test(`visual ${route}`, async ({ page }, testInfo) => {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      if (route !== '/visual-404-check') expect(response?.status() || 0).toBeLessThan(400);
      await expectBrandVisible(page);
      await captureVisual(page, testInfo, route);
    });
  }
});

test.describe('deployed production learner QA', () => {
  test.skip(!enabled, 'Production QA runs only after the Vercel deployment is ready.');

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('all student dashboard routes render without production errors', async ({ page }, testInfo) => {
    const failures = watchRuntimeFailures(page);
    const routes = [
      '/dashboard',
      '/dashboard/courses',
      '/dashboard/curriculum',
      '/dashboard/lessons',
      '/dashboard/assignments',
      '/dashboard/exams',
      '/dashboard/past-questions',
      '/dashboard/flashcards',
      '/dashboard/ai/tutor',
      '/dashboard/library',
      '/dashboard/community',
      '/dashboard/progress',
      '/dashboard/reports',
      '/dashboard/gamification',
      '/dashboard/notifications',
      '/dashboard/recent',
      '/dashboard/saved',
      '/dashboard/downloads',
      '/dashboard/live-classes',
      '/dashboard/certificates',
      '/dashboard/subscriptions/plans',
      '/dashboard/profile/settings',
    ];

    for (const route of routes) {
      await test.step(route, async () => {
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response?.status() || 0, `${route} returned a bad document status`).toBeLessThan(400);
        await page.waitForTimeout(300);
        expect(new URL(page.url()).pathname, `${route} unexpectedly redirected`).toBe(route);
        await expect(page.locator('body')).not.toContainText(fatalText);
        await expectBrandVisible(page);
        await captureVisual(page, testInfo, route);
      });
    }
    await testInfo.attach('route-count', { body: String(routes.length), contentType: 'text/plain' });
    await expectHealthy(page, failures);
  });

  test('published lesson opens and renders from real curriculum data', async ({ page }) => {
    const failures = watchRuntimeFailures(page);
    const token = await accessToken(page);
    expect(token).toBeTruthy();
    const target = await page.evaluate(async ({ supabaseUrl, publishableKey, token }) => {
      const headers = { apikey: publishableKey, Authorization: `Bearer ${token}` };
      const lessonResponse = await fetch(`${supabaseUrl}/rest/v1/lessons?select=id,title,course_id&is_published=eq.true&order=updated_at.desc&limit=1`, { headers });
      const lessons = await lessonResponse.json();
      const lesson = lessons?.[0];
      if (!lesson) return null;
      const courseResponse = await fetch(`${supabaseUrl}/rest/v1/courses?select=id,slug,title&id=eq.${lesson.course_id}&limit=1`, { headers });
      const courses = await courseResponse.json();
      const course = courses?.[0];
      return course ? { lessonId: lesson.id, lessonTitle: lesson.title, courseRef: course.slug || course.id } : null;
    }, { supabaseUrl, publishableKey, token });
    expect(target).toBeTruthy();
    await page.goto(`/dashboard/lessons/${encodeURIComponent(target.courseRef)}/${encodeURIComponent(target.lessonId)}`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByText(target.lessonTitle, { exact: false }).first()).toBeVisible();
    await expectHealthy(page, failures);
  });

  test('exam can start, accept answers, submit, and open results', async ({ page }) => {
    test.setTimeout(120000);
    const failures = watchRuntimeFailures(page);
    await page.goto('/dashboard/exams', { waitUntil: 'domcontentloaded' });
    const examLink = page.locator('a[href^="/dashboard/exams/"]').first();
    await expect(examLink).toBeVisible();
    await examLink.click();
    const startButton = page.getByRole('button', { name: /Start CBT/i });
    await expect(startButton).toBeEnabled();
    await startButton.click();
    await expect(page.getByText(/Question 1 of/i)).toBeVisible({ timeout: 30000 });

    const answerCurrent = async () => {
      const option = page.locator('main button span.font-bold').first().locator('..');
      if (await option.count()) {
        await option.click();
      } else {
        await page.locator('main textarea').fill('Production QA response');
      }
    };

    await answerCurrent();
    const questionNav = page.locator('aside button');
    const count = await questionNav.count();
    if (count > 1) {
      await questionNav.nth(count - 1).click();
      await answerCurrent();
    }
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: /Submit CBT/i }).click();
    await page.waitForURL(/\/dashboard\/exams\/[^/]+\/results/, { timeout: 30000 });
    await expect(page.locator('body')).toContainText(/score|result|passed|questions/i);
    await expectHealthy(page, failures);
  });

  test('past questions load and verified answer checking works', async ({ page }) => {
    const failures = watchRuntimeFailures(page);
    await page.goto('/dashboard/past-questions', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Past Questions CBT/i })).toBeVisible();
    await expect(page.getByText(/Original source papers/i)).toHaveCount(0);
    await expect(page.locator('a[href*=".pdf"], a[href*="/storage/v1/object/"]')).toHaveCount(0);
    const token = await accessToken(page);
    const result = await page.evaluate(async ({ supabaseUrl, publishableKey, token }) => {
      const headers = { apikey: publishableKey, Authorization: `Bearer ${token}`, 'content-type': 'application/json' };
      let question = null;
      let listStatus = 0;
      let listText = '';
      for (let pageNo = 1; pageNo <= 20 && !question; pageNo += 1) {
        const listResponse = await fetch(`${supabaseUrl}/functions/v1/web-api/past-questions?board=jamb&page=${pageNo}&limit=100`, { headers });
        listStatus = listResponse.status;
        listText = await listResponse.text();
        if (!listResponse.ok) return { listStatus, listText };
        const list = JSON.parse(listText);
        const rows = list?.data?.questions || [];
        question = rows.find((item) => item?.hasAnswer === true && Array.isArray(item?.options) && item.options.length > 0) || null;
        const totalPages = Number(list?.pagination?.totalPages || 0);
        if (totalPages && pageNo >= totalPages) break;
      }
      if (!question) return { listStatus, listText, error: 'No graded JAMB question returned' };
      const options = question.options;
      const answer = String(options[0]?.id ?? options[0]?.value ?? options[0]?.label ?? options[0] ?? 'A');
      const checkResponse = await fetch(`${supabaseUrl}/functions/v1/web-api/past-questions/${question.id}/check`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ answer }),
      });
      return { listStatus, checkStatus: checkResponse.status, checkText: await checkResponse.text() };
    }, { supabaseUrl, publishableKey, token });
    expect(result.listStatus, result.listText).toBe(200);
    expect(result.error, result.listText).toBeFalsy();
    expect(result.checkStatus, result.checkText).toBe(200);
    const checked = JSON.parse(result.checkText);
    expect(checked?.data?.result?.correctAnswer).toBeTruthy();
    expect(typeof checked?.data?.result?.isCorrect).toBe('boolean');
    await expectHealthy(page, failures);
  });

  test('Flashcards generate through the real UI and can be reviewed', async ({ page }) => {
    test.setTimeout(180000);
    const failures = watchRuntimeFailures(page);
    await page.goto('/dashboard/flashcards', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /^Flashcards$/i })).toBeVisible();
    const selects = page.getByRole('combobox');
    const subject = selects.nth(0);
    const topic = selects.nth(1);
    await expect.poll(async () => await subject.locator('option').count(), { timeout: 20000 }).toBeGreaterThan(1);
    await subject.selectOption({ index: 1 });
    await expect.poll(async () => await topic.locator('option').count(), { timeout: 20000 }).toBeGreaterThan(1);
    await topic.selectOption({ index: 1 });
    await page.getByRole('button', { name: /Generate 20 cards/i }).click();
    await expect(page.getByText(/Card 1 of 20/i)).toBeVisible({ timeout: 120000 });
    const reveal = page.getByRole('button', { name: /Reveal answer/i });
    await expect(reveal).toBeVisible();
    await reveal.click();
    await page.getByRole('button', { name: /^Next/i }).click();
    await expect(page.getByText(/Card 2 of 20/i)).toBeVisible();
    await expectHealthy(page, failures);
  });

  test('AI Tutor completes a real two-turn Bynara conversation', async ({ page }) => {
    test.setTimeout(300000);
    const failures = watchRuntimeFailures(page);
    await page.goto('/dashboard/ai/tutor', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /AI Tutor/i })).toBeVisible();
    const selects = page.getByRole('combobox');
    const subject = selects.nth(0);
    const topic = selects.nth(1);
    await expect.poll(async () => await subject.locator('option').count(), { timeout: 20000 }).toBeGreaterThan(1);
    await subject.selectOption({ index: 1 });
    await expect.poll(async () => await topic.locator('option').count(), { timeout: 20000 }).toBeGreaterThan(1);
    await topic.selectOption({ index: 1 });

    const input = page.getByPlaceholder('Ask me anything about your studies...');
    const send = async (message) => {
      await input.fill(message);
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/functions/v1/ai') && response.request().method() === 'POST',
        { timeout: 120000 },
      );
      await input.press('Enter');
      const response = await responsePromise;
      const text = await response.text();
      expect(response.status(), text).toBe(200);
      const payload = JSON.parse(text);
      expect(payload?.message?.content).toBeTruthy();
      return payload;
    };

    const first = await send('Define photosynthesis in one short sentence.');
    const second = await send('Now give one simple example related to that explanation.');
    expect(first.sessionId).toBeTruthy();
    expect(second.sessionId).toBe(first.sessionId);
    await expectHealthy(page, failures);
  });

  test('profile changes save and the free subscription flow reaches billing', async ({ page }) => {
    const failures = watchRuntimeFailures(page);
    await page.goto('/dashboard/profile/settings', { waitUntil: 'domcontentloaded' });
    const firstName = page.getByText('First Name', { exact: true }).locator('..').locator('input');
    const lastName = page.getByText('Last Name', { exact: true }).locator('..').locator('input');
    await firstName.fill('Production');
    await lastName.fill('QA');
    await page.getByRole('button', { name: /Save Changes/i }).click();
    await expect(page.getByText(/Profile saved successfully/i)).toBeVisible({ timeout: 20000 });

    await page.goto('/dashboard/subscriptions/plans', { waitUntil: 'domcontentloaded' });
    const freeHeading = page.getByRole('heading', { name: /^Free$/i }).first();
    await expect(freeHeading).toBeVisible();
    await freeHeading.locator('..').click();
    const activate = page.getByRole('button', { name: /Activate free plan/i });
    await expect(activate).toBeEnabled();
    await activate.click();
    await page.waitForURL(/\/dashboard\/subscriptions\/billing/, { timeout: 30000 });
    await expectHealthy(page, failures);
  });
});
