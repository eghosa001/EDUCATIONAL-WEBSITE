import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const attemptPage = fs.readFileSync(new URL('../src/app/dashboard/exams/[examId]/page.tsx', import.meta.url), 'utf8');
const resultPage = fs.readFileSync(new URL('../src/app/dashboard/exams/[examId]/results/page.tsx', import.meta.url), 'utf8');
const webApi = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261003150000_harden_cbt_attempt_storage.sql', import.meta.url), 'utf8');

test('CBT answers autosave and active attempts resume', () => {
  assert.match(attemptPage, /persistAnswer/);
  assert.match(attemptPage, /savedAnswers/);
  assert.match(webApi, /savedAnswers/);
  assert.match(webApi, /status==='in_progress'/);
  assert.match(webApi, /questionIds/);
});

test('timed CBT is enforced from server deadline', () => {
  assert.match(webApi, /deadlineAt/);
  assert.match(webApi, /timedOut/);
  assert.match(attemptPage, /isTimed/);
  assert.match(attemptPage, /remainingSeconds/);
});

test('exam result is persistent and no longer localStorage-only', () => {
  assert.doesNotMatch(resultPage, /localStorage/);
  assert.match(resultPage, /attempts\/latest\/result/);
  assert.match(webApi, /latestExamResultMatch/);
});

test('exam answers support safe upsert per attempt and question', () => {
  assert.match(migration, /unique index.*exam_answers_attempt_question_uidx/is);
  assert.match(migration, /attempt_id, question_id/);
  assert.match(webApi, /onConflict:'attempt_id,question_id'/);
});
