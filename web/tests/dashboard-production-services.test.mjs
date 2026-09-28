import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('learner dashboard data services do not depend on the missing /api/v1 backend', () => {
  for (const file of [
    '../src/services/api/assignmentService.ts',
    '../src/services/api/libraryService.ts',
    '../src/features/liveClasses/service.ts',
  ]) {
    const source = read(file);
    assert.match(source, /getSupabase/);
  }
  const community = read('../src/services/api/communityService.ts');
  assert.match(community, /from\('community_posts'\)/);
  const saved = read('../src/app/dashboard/saved/page.tsx');
  assert.match(saved, /from\('bookmarks'\)/);
});

test('production visual QA rejects visible feature error banners', () => {
  const source = read('../e2e/production-deployed.spec.mjs');
  assert.match(source, /\[role="alert"\]:visible/);
  assert.match(source, /Failed to load\|Unable to load/);
});

test('gamification uses the live Supabase badge catalog instead of hard-coded achievements', () => {
  const service = read('../src/services/api/gamificationService.ts');
  assert.match(service, /from\('badges'\)/);
  assert.match(service, /from\('achievements'\)/);
  const page = read('../src/app/dashboard/gamification/page.tsx');
  assert.match(page, /fetchBadges/);
  assert.doesNotMatch(page, /const ACHIEVEMENTS/);
  assert.match(page, /role="alert"/);
});
