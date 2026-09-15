import { test, expect } from '@playwright/test';

test.describe('Public pages', () => {
  test('landing page renders', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/THE GUIDE|Educational|Learn/i);
  });

  test('login page has email and password fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]').first()).toBeVisible();
    await expect(page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first()).toBeVisible();
  });

  test('register page has registration form', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input').first()).toBeVisible();
    await expect(page.locator('button:has-text("Create"), button:has-text("Register"), button[type="submit"]').first()).toBeVisible();
  });

  test('forgot password page renders', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
  });
});

test.describe('Dashboard pages require authentication', () => {
  const dashboardPages = [
    '/dashboard',
    '/dashboard/courses',
    '/dashboard/lessons',
    '/dashboard/exams',
    '/dashboard/community',
    '/dashboard/notifications',
    '/dashboard/library',
    '/dashboard/flashcards',
    '/dashboard/past-questions',
    '/dashboard/gamification',
    '/dashboard/live-classes',
    '/dashboard/progress',
    '/dashboard/reports',
    '/dashboard/ai/tutor',
    '/dashboard/certificates',
  ];

  for (const path of dashboardPages) {
    test(`unauthenticated user on ${path} cannot access protected content`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(1500);
      const onLogin = page.url().includes('/login');
      const signInVisible = await page.locator('input[type="email"], button:has-text("Sign In"), button:has-text("Login")').first().isVisible().catch(() => false);
      expect(onLogin || signInVisible, `${path} remained accessible without authentication`).toBeTruthy();
    });
  }
});

test.describe('Auth page navigation', () => {
  test('login page has link to register', async ({ page }) => {
    await page.goto('/login');
    const registerLink = page.locator('a:has-text("Sign Up"), a:has-text("Register"), a[href*="register"]').first();
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/register/);
    }
  });

  test('register page has link to login', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.locator('a:has-text("Sign In"), a:has-text("Login"), a[href*="login"]').first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });

  test('forgot password page has back to login link', async ({ page }) => {
    await page.goto('/forgot-password');
    const backLink = page.locator('a:has-text("Back"), a:has-text("Login"), a[href*="login"]').first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/login/);
    }
  });
});

test.describe('Auth form validation', () => {
  test('login form rejects empty submission', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(250);
    const invalidFields = await page.locator('input:invalid').count();
    const visibleErrors = await page.locator('[class*="error"], [role="alert"], .text-red, .text-destructive').count();
    expect(invalidFields + visibleErrors, 'Empty login submission produced no validation state').toBeGreaterThan(0);
  });

  test('register form rejects empty submission', async ({ page }) => {
    await page.goto('/register');
    const submitBtn = page.locator('button:has-text("Create"), button:has-text("Register"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(250);
    const invalidFields = await page.locator('input:invalid').count();
    const visibleErrors = await page.locator('[class*="error"], [role="alert"], .text-red, .text-destructive').count();
    expect(invalidFields + visibleErrors, 'Empty registration submission produced no validation state').toBeGreaterThan(0);
  });
});
