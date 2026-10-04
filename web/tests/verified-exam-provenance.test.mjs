import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261004043000_require_verified_historical_exam_answers.sql', import.meta.url), 'utf8');

test('historical scoring requires source-backed answer verification', () => {
  assert.match(api, /verifiedHistoricalAnswerSources/);
  assert.match(api, /answer_verified_at/);
  assert.match(api, /source-pdf-embedded-answer/);
  assert.match(api, /This historical question does not have a verified source-backed answer key yet/);
  assert.match(migration, /answer_verified_at is not null/);
  assert.match(migration, /answer_source in/);
  assert.match(migration, /Questions-and-Answers material/);
});
