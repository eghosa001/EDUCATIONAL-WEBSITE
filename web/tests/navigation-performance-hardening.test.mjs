import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..');
const read = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

const apiConfig = read('web/src/services/api/config.ts');
const examBoardService = read('web/src/services/api/examBoardService.ts');
const dashboardLayout = read('web/src/app/dashboard/layout.tsx');
const dashboardLoading = read('web/src/app/dashboard/loading.tsx');
const jambPage = read('web/src/app/dashboard/jamb/page.tsx');
const examsPage = read('web/src/app/dashboard/exams/page.tsx');

describe('dashboard navigation and data loading hardening', () => {
  it('adds shared retry, timeout and stale-cache API helpers', () => {
    expect(apiConfig).toContain('TRANSIENT_STATUS_CODES');
    expect(apiConfig).toContain('export const apiFetch');
    expect(apiConfig).toContain('AbortController');
    expect(apiConfig).toContain('retries');
    expect(apiConfig).toContain('export const fetchCachedJson');
    expect(apiConfig).toContain('allowStaleOnError');
    expect(apiConfig).toContain('readStaleCache');
  });

  it('routes exam availability through the resilient cache instead of raw fetches', () => {
    expect(examBoardService).toContain('fetchCachedJson');
    expect(examBoardService).toContain('fetchVerifiedPracticeAvailability');
    expect(examBoardService).toContain('allowStaleOnError: true');
    expect(examBoardService).not.toMatch(/\bfetch\s*\(/);
  });

  it('prevents one failed availability request from crashing JAMB and Exams pages', () => {
    for (const source of [jambPage, examsPage]) {
      expect(source).toContain('Promise.allSettled');
      expect(source).toContain('AbortController');
      expect(source).toContain('fetchVerifiedPracticeAvailability');
      expect(source).not.toContain('verified-practice-availability`');
      expect(source).not.toContain('learnerApiConfig.baseUrl');
    }
  });

  it('prefetches dashboard routes and gives immediate navigation feedback', () => {
    expect(dashboardLayout).toContain('dashboardPrefetchRoutes');
    expect(dashboardLayout).toContain('router.prefetch');
    expect(dashboardLayout).toContain('pendingHref');
    expect(dashboardLayout).toContain('requestIdleCallback');
  });

  it('uses a dashboard skeleton instead of a blank spinner during route loads', () => {
    expect(dashboardLoading).toContain('animate-pulse');
    expect(dashboardLoading).toContain('grid gap-4 md:grid-cols-3');
    expect(dashboardLoading).not.toContain('Loading…');
  });
});
