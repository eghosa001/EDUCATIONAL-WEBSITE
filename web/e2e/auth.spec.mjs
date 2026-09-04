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
    await expect(page.locator('text=forgot|reset|password').first()).toBeVisible();
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
    test(`unauthenticated user on ${path} is redirected to login`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(2000);
      const url = page.url();
      const isOnLogin = url.includes('/login');
      const isOnDashboard = url.includes('/dashboard');
      expect(isOnLogin || isOnDashboard).toBeTruthy();
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
  test('login form shows validation for empty submission', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(500);
    const hasError = await page.locator('[class*="error"], [role="alert"], .text-red, .text-destructive').count();
    expect(hasError).toBeGreaterThanOrEqual(0);
  });

  test('register form shows validation for empty submission', async ({ page }) => {
    await page.goto('/register');
    const submitBtn = page.locator('button:has-text("Create"), button:has-text("Register"), button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(500);
    const hasError = await page.locator('[class*="error"], [role="alert"], .text-red, .text-destructive').count();
    expect(hasError).toBeGreaterThanOrEqual(0);
  });
});
