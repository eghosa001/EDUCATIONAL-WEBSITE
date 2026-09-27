import { test, expect } from '@playwright/test';

const enabled = process.env.PRODUCTION_SMOKE === '1';
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const testEmail = process.env.TEST_EMAIL || '';
const testPassword = process.env.TEST_PASSWORD || '';

test.describe('deployed production learner smoke', () => {
  test.skip(!enabled, 'Production smoke runs only after the Vercel deployment is ready.');

  test('production site and learner Edge API are reachable from the real browser origin', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    expect(supabaseUrl).toBeTruthy();
    expect(publishableKey).toBeTruthy();

    const result = await page.evaluate(async ({ supabaseUrl, publishableKey }) => {
      const headers = { apikey: publishableKey };
      const get = async (path) => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/web-api${path}`, { headers });
          return { status: response.status, text: await response.text() };
        } catch (error) {
          return { status: 0, text: String(error) };
        }
      };
      return {
        exams: await get('/exams?limit=1'),
        pastQuestions: await get('/past-questions?board=jamb&limit=1'),
      };
    }, { supabaseUrl, publishableKey });

    expect(result.exams.status, result.exams.text).toBe(200);
    expect(result.pastQuestions.status, result.pastQuestions.text).toBe(200);
    const exams = JSON.parse(result.exams.text);
    const pastQuestions = JSON.parse(result.pastQuestions.text);
    expect(Array.isArray(exams?.data?.exams)).toBeTruthy();
    expect(exams.data.exams.length).toBeGreaterThan(0);
    expect(Array.isArray(pastQuestions?.data?.questions)).toBeTruthy();
    expect(pastQuestions.data.questions.length).toBeGreaterThan(0);
  });

  test('Flashcards and AI survive browser CORS preflight on production', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate(async ({ supabaseUrl, publishableKey }) => {
      const probe = async (name) => {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
            method: 'POST',
            headers: { apikey: publishableKey, 'content-type': 'application/json' },
            body: JSON.stringify({}),
          });
          return { status: response.status, text: await response.text() };
        } catch (error) {
          return { status: 0, text: String(error) };
        }
      };
      return { flashcards: await probe('flashcards'), ai: await probe('ai') };
    }, { supabaseUrl, publishableKey });

    expect(result.flashcards.status, result.flashcards.text).not.toBe(0);
    expect(result.ai.status, result.ai.text).not.toBe(0);
    expect(result.flashcards.status).toBeLessThan(500);
    expect(result.ai.status).toBeLessThan(500);
  });

  test('signed-in learner pages and live AI calls work when the CI learner account is configured', async ({ page }) => {
    test.skip(!testEmail || !testPassword, 'Set TEST_EMAIL and TEST_PASSWORD for authenticated production coverage.');
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"], input[name="email"]').first().fill(testEmail);
    await page.locator('input[type="password"], input[name="password"]').first().fill(testPassword);
    await page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first().click();
    await page.waitForURL(/dashboard/, { timeout: 20000 });

    await page.goto('/dashboard/exams', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Practice Exams/i })).toBeVisible();
    await expect(page.locator('a[href^="/dashboard/exams/"]').first()).toBeVisible();

    await page.goto('/dashboard/past-questions', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Past Questions CBT/i })).toBeVisible();
    await expect(page.getByText(/Route GET .*not available|Unable to load this question bank/i)).toHaveCount(0);

    const live = await page.evaluate(async ({ supabaseUrl, publishableKey }) => {
      const storageKey = Object.keys(localStorage).find((key) => key.startsWith('sb-') && key.endsWith('-auth-token'));
      const raw = storageKey ? localStorage.getItem(storageKey) : null;
      const session = raw ? JSON.parse(raw) : null;
      const token = session?.access_token || session?.currentSession?.access_token || session?.session?.access_token || '';
      if (!token) return { error: 'No Supabase access token found after login' };
      const headers = { apikey: publishableKey, Authorization: `Bearer ${token}` };
      const subjectRes = await fetch(`${supabaseUrl}/rest/v1/subjects?select=id&is_active=eq.true&order=order_index.asc&limit=1`, { headers });
      const subjects = await subjectRes.json();
      const subjectId = subjects?.[0]?.id;
      if (!subjectId) return { error: 'No active subject available for production smoke' };
      const topicRes = await fetch(`${supabaseUrl}/rest/v1/topics?select=id&subject_id=eq.${encodeURIComponent(subjectId)}&is_active=eq.true&order=order_index.asc&limit=1`, { headers });
      const topics = await topicRes.json();
      const topicId = topics?.[0]?.id;
      if (!topicId) return { error: 'No active topic available for production smoke' };
      const flashResponse = await fetch(`${supabaseUrl}/functions/v1/flashcards`, {
        method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ subjectId, topicId, count: 5 }),
      });
      const flashText = await flashResponse.text();
      const aiResponse = await fetch(`${supabaseUrl}/functions/v1/ai`, {
        method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'tutor', message: 'Reply with one short sentence defining photosynthesis.', subjectId, topicId, context: { currentSubject: 'smoke-test', currentTopic: 'smoke-test' } }),
      });
      const aiText = await aiResponse.text();
      return { flashStatus: flashResponse.status, flashText, aiStatus: aiResponse.status, aiText };
    }, { supabaseUrl, publishableKey });

    expect(live.error || '', live.error || '').toBe('');
    expect(live.flashStatus, live.flashText).toBe(200);
    expect(JSON.parse(live.flashText)?.flashcards?.length).toBe(5);
    expect(live.aiStatus, live.aiText).toBe(200);
    expect(JSON.parse(live.aiText)?.message?.content).toBeTruthy();
  });
});
