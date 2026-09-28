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

test('parent, teacher, and school dashboards use the Supabase learner boundary for their visible workflows', () => {
  const parent = read('../src/services/api/parentService.ts');
  const teacher = read('../src/services/api/teacherService.ts');
  const school = read('../src/services/api/schoolService.ts');
  assert.match(parent, /learnerApiConfig/);
  assert.doesNotMatch(parent, /apiConfig\.baseUrl/);
  for (const route of ['teachers/me', 'teachers/courses', 'teachers/students', 'teachers/earnings/summary', 'teachers/analytics']) {
    assert.match(teacher, new RegExp(route.replaceAll('/', '\\/')));
  }
  assert.match(teacher, /teacherEdgeBaseUrl = learnerApiConfig\.baseUrl/);
  assert.match(school, /learnerApiConfig\.baseUrl\}\/schools/);
  assert.doesNotMatch(school, /JSON\.stringify\(\{ schoolCode, credentials/);
});

test('flashcards are curriculum-first and AI is only a bounded rescue path', () => {
  const source = read('../../supabase/functions/flashcards/index.ts');
  assert.match(source, /groundedFallbackCards/);
  assert.match(source, /from\("lessons"\)/);
  assert.match(source, /cards\.length < Math\.min\(5, count\)/);
  assert.match(source, /AI flashcard rescue failed/);
  assert.match(source, /timeoutMs = 8_000/);
});

test('school browse and join are implemented in the Supabase web API', () => {
  const source = read('../../supabase/functions/web-api/index.ts');
  assert.match(source, /path==='\/schools'/);
  assert.match(source, /path==='\/schools\/join'/);
  assert.match(source, /school_students/);
  assert.match(source, /school_teachers/);
});

test('root CBT uses a separate question-count screen and can draw storage-backed past questions', () => {
  const source = read('../../pages/app.js');
  assert.match(source, /renderCbtCountSetup/);
  assert.match(source, /path==='\/cbt\/count'/);
  assert.match(source, /path==='\/cbt\/exam'/);
  assert.match(source, /past-questions\/session/);
  assert.match(source, /past-questions\/grade/);
  const setupBlock = source.slice(source.indexOf('async function renderCbtSetup'), source.indexOf('function renderCbtCountSetup'));
  assert.doesNotMatch(setupBlock, /id="cbt-count"/);
});

test('flashcard generation is curriculum-first and does not wait on AI when lessons are sufficient', () => {
  const fn = read('../../supabase/functions/flashcards/index.ts');
  const page = read('../src/app/dashboard/flashcards/page.tsx');
  assert.match(fn, /groundedFallbackCards\(topic as Record<string, unknown>, lessonRows \|\| \[\], count\)/);
  assert.match(fn, /cards\.length < Math\.min\(5, count\)/);
  assert.match(fn, /timeoutMs = 8_000/);
  assert.match(page, /useState\(10\)/);
  assert.match(page, /Building from lesson/);
});

test('past-question CBT session and grading stay server-side', () => {
  const source = read('../../supabase/functions/web-api/index.ts');
  assert.match(source, /path==='\/past-questions\/session'/);
  assert.match(source, /path==='\/past-questions\/grade'/);
  assert.match(source, /correct_answer/);
  assert.match(source, /const\{correct_answer,\.\.\.safe\}=row/);
});

test('deployed Past Questions CBT separates selection, count, exam and results phases', () => {
  const source = read('../src/app/dashboard/past-questions/page.tsx');
  assert.match(source, /type Phase = 'setup' \| 'count' \| 'exam' \| 'results'/);
  assert.match(source, /Choose question count/);
  assert.match(source, /Continue to question count/);
  assert.match(source, /past-questions\/session/);
  assert.match(source, /past-questions\/grade/);
  assert.doesNotMatch(source, /question-bank/);
});

test('past-question availability exposes only scoreable MCQs', () => {
  const api = read('../../supabase/functions/web-api/index.ts');
  assert.match(api, /past-question-availability/);
  assert.match(api, /question_type,correct_answer/);
  assert.match(api, /scalarAnswer\(row\.correct_answer\)/);
});

test('AI Tutor preserves the session with a curriculum fallback when providers fail', () => {
  const source = read('../../supabase/functions/ai/index.ts');
  assert.match(source, /curriculumTutorFallback/);
  assert.match(source, /Tutor providers unavailable; using curriculum fallback/);
  assert.match(source, /responseModel = 'curriculum-fallback'/);
  assert.match(source, /release_ai_request/);
});

test('flashcard curriculum fallback can build cards from ordinary lesson prose', () => {
  const source = read('../../supabase/functions/flashcards/index.ts');
  assert.match(source, /proseChunks/);
  assert.match(source, /What important idea/);
  assert.match(source, /What is key point/);
});
