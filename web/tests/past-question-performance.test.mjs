import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cbtPage = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
const analyticsPage = fs.readFileSync(new URL('../src/app/dashboard/past-questions/analytics/page.tsx', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../src/services/api/pastQuestionAnalyticsService.ts', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261003170000_add_past_question_attempt_analytics.sql', import.meta.url), 'utf8');

test('graded past-question sessions are persisted without answer keys in analytics rows', () => {
  assert.match(api, /past_question_attempts/);
  assert.match(api, /analyticsAnswers/);
  assert.match(api, /subjectId/);
  assert.match(api, /topicLabel/);
  assert.doesNotMatch(migration, /correct_answer/i);
});

test('past-question insights are private to the signed-in learner', () => {
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /for select to authenticated/i);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/i);
  assert.match(api, /path==='\/past-questions\/insights'/);
  assert.match(api, /\.eq\('user_id',user\.id\)/);
});

test('CBT submission sends performance metadata and links to analytics', () => {
  assert.match(cbtPage, /timeSpentSeconds/);
  assert.match(cbtPage, /board: selectedExam/);
  assert.match(cbtPage, /\/dashboard\/past-questions\/analytics/);
});

test('analytics page shows board subject and topic-area performance', () => {
  assert.match(service, /fetchPastQuestionInsights/);
  assert.match(analyticsPage, /Performance by examination/);
  assert.match(analyticsPage, /Subject accuracy/);
  assert.match(analyticsPage, /Strong topics/);
  assert.match(analyticsPage, /Needs attention/);
  assert.match(analyticsPage, /Recent CBT sessions/);
});
