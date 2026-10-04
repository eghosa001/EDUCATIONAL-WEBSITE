import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('flashcards use prebuilt curriculum resources instead of on-demand generation', () => {
  const page = read('../src/app/dashboard/flashcards/page.tsx');
  const service = read('../src/services/api/aiService.ts');
  assert.match(page, /fetchPrebuiltFlashcards/);
  assert.match(page, /Ready-made curriculum flashcards/);
  assert.doesNotMatch(page, /generateAiFlashcards/);
  assert.doesNotMatch(page, /Generate Flashcards/);
  assert.match(service, /mode', 'curriculum-prebuilt'/);
  assert.match(service, /created_by', null/);
});

test('lesson pages expose prebuilt flashcards and prebuilt practice', () => {
  const page = read('../src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx');
  const practice = read('../../supabase/functions/lesson-practice/index.ts');
  assert.match(page, /fetchPrebuiltFlashcards/);
  assert.match(page, /Flashcards/);
  assert.match(page, /count: 8, allowAi: false/);
  assert.match(page, /Open practice set/);
  assert.match(practice, /cached\.questions\.slice\(0, count\)/);
});

test('production migrations keep generated learning resources separate from genuine exams', () => {
  const resources = read('../../supabase/migrations/20261004035000_prebuilt_learning_resources.sql');
  const examSecurity = read('../../supabase/migrations/20261004034500_secure_verified_exam_bank.sql');
  assert.match(resources, /learning_content_pipeline/);
  assert.match(resources, /curriculum-prebuilt/);
  assert.match(resources, /prebuild_learning_resource_batch/);
  assert.match(resources, /provenanceBasis','published-lesson'/);
  assert.match(examSecurity, /drop policy if exists past_questions_select_all/);
  assert.match(examSecurity, /learner_past_questions/);
  assert.match(examSecurity, /source like 'storage:%'/);
});
