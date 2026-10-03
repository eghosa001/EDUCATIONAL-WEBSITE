import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const progressService = fs.readFileSync(new URL('../src/services/api/progressService.ts', import.meta.url), 'utf8');
const progressPage = fs.readFileSync(new URL('../src/app/dashboard/progress/page.tsx', import.meta.url), 'utf8');
const reportsPage = fs.readFileSync(new URL('../src/app/dashboard/reports/page.tsx', import.meta.url), 'utf8');
const lessonPage = fs.readFileSync(new URL('../src/app/dashboard/lessons/[courseId]/[lessonId]/page.tsx', import.meta.url), 'utf8');
const practiceFunction = fs.readFileSync(new URL('../../supabase/functions/lesson-practice/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261003141000_add_lesson_practice_attempt_analytics.sql', import.meta.url), 'utf8');

test('student progress uses actual learning evidence', () => {
  assert.match(progressService, /from\('lesson_progress'\)/);
  assert.match(progressService, /from\('lesson_practice_attempts'\)/);
  assert.match(progressService, /fetchLearningInsights/);
  assert.match(progressService, /calculateStreaks/);
  assert.match(progressPage, /Strong topics/);
  assert.match(progressPage, /Needs attention/);
  assert.match(progressPage, /weeklyActivity/);
});

test('lesson activity and practice outcomes are recorded', () => {
  assert.match(lessonPage, /startStudySession/);
  assert.match(lessonPage, /endStudySession/);
  assert.match(practiceFunction, /lesson_practice_attempts/);
  assert.match(practiceFunction, /is_correct: isCorrect/);
});

test('practice analytics are private to the authenticated learner', () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /for select\s+to authenticated/i);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(migration, /revoke all.*anon, authenticated, service_role/i);
});

test('student report uses the same progress intelligence source', () => {
  assert.match(reportsPage, /fetchLearningInsights/);
  assert.match(reportsPage, /Practice Accuracy/);
  assert.match(reportsPage, /topic-performance\.csv/);
});
