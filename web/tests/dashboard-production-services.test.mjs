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

test('learner-visible services do not call the retired /api/v1 backend', () => {
  const recent = read('../src/app/dashboard/recent/page.tsx');
  const lesson = read('../src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx');
  const notifications = read('../src/services/api/notificationService.ts');
  const certificates = read('../src/services/api/certificateService.ts');
  const payments = read('../src/services/api/paymentService.ts');
  for (const source of [recent, lesson]) assert.match(source, /learnerApiConfig/);
  for (const source of [notifications, certificates, payments]) {
    assert.match(source, /getSupabase/);
    assert.doesNotMatch(source, /apiConfig\.baseUrl|\/api\/v1/);
  }
});

test('paid checkout is implemented by the Supabase payments boundary and callback verification', () => {
  const payments = read('../../supabase/functions/payments/index.ts');
  const billing = read('../src/app/dashboard/subscriptions/billing/page.tsx');
  assert.match(payments, /action === 'create-payment'/);
  assert.match(payments, /action === 'verify-payment'/);
  assert.match(payments, /transaction\/verify/);
  assert.match(payments, /transactions\/\$\{encodeURIComponent\(transactionId\)\}\/verify/);
  assert.match(billing, /verifyPayment\(/);
  assert.match(billing, /dashboard\/subscriptions\/plans/);
});

test('course completion issues certificates and certificate UI has working print/share actions', () => {
  const api = read('../../supabase/functions/web-api/index.ts');
  const page = read('../src/app/dashboard/certificates/page.tsx');
  assert.match(api, /certificate_issued_at/);
  assert.match(page, /Print \/ Save PDF/);
  assert.match(page, /navigator\.share/);
});
