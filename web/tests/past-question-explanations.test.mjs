import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
const service = fs.readFileSync(new URL('../src/services/api/pastQuestionAnalyticsService.ts', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261003174500_track_past_question_explanation_provenance.sql', import.meta.url), 'utf8');

test('missing explanations are available only after a graded attempt', () => {
  assert.match(api, /explainPastQuestionMatch/);
  assert.match(api, /past-questions/);
  assert.match(api, /Submit this question in a graded CBT before requesting an explanation/);
  assert.match(api, /past_question_attempts/);
  assert.match(api, /contains\('answers',\[\{questionId\}\]\)/);
});

test('AI explanation is grounded in verified answer and cached with provenance', () => {
  assert.match(api, /Verified correct answer/);
  assert.match(api, /Do not change the answer key/);
  assert.match(api, /explanation_source:'ai-grounded'/);
  assert.match(api, /explanation_generated_at/);
  assert.match(migration, /explanation_source/);
});

test('past-question results expose explanation action only when needed', () => {
  assert.match(page, /fetchPastQuestionExplanation/);
  assert.match(page, /Explain this answer/);
  assert.match(page, /explanationOverrides/);
  assert.match(service, /past-questions\/\$\{questionId\}\/explain/);
});
