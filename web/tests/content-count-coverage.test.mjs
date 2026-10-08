import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const migration = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'migrations', '20261008154500_content_count_coverage_gate.sql'),
  'utf8',
);

test('content coverage gate measures every learner-facing bank instead of trusting raw counts', () => {
  assert.match(migration, /create or replace view public\.learning_content_coverage/);
  assert.match(migration, /learner_past_questions/);
  assert.match(migration, /verified_practice_questions/);
  assert.match(migration, /curriculum_questions/);
  assert.match(migration, /flashcards/);
  assert.match(migration, /published_lessons/);
});

test('past-question and verified-practice count thresholds distinguish 9 plus from thin banks', () => {
  assert.match(migration, /100::int as target_9_plus_count/);
  assert.match(migration, /40::int as minimum_usable_count/);
  assert.match(migration, /50::int as target_9_plus_count/);
  assert.match(migration, /20::int as minimum_usable_count/);
  assert.match(migration, /deficit_to_9_plus/);
  assert.match(migration, /coverage_status/);
});

test('coverage gate checks active and verified question counts, not just imported rows', () => {
  assert.match(migration, /active_count/);
  assert.match(migration, /verified_count/);
  assert.match(migration, /answer_verified_at is not null/);
  assert.match(migration, /verified_at is not null/);
  assert.match(migration, /correct_answer is not null/);
  assert.match(migration, /jsonb_array_length\(q\.options\) >= 2/);
});

test('coverage report is service-only and returns deficit details for the API layer', () => {
  assert.match(migration, /revoke all on table public\.learning_content_coverage from public, anon, authenticated/);
  assert.match(migration, /grant select on table public\.learning_content_coverage to service_role/);
  assert.match(migration, /create or replace function public\.get_learning_content_coverage\(\)/);
  assert.match(migration, /security definer/);
  assert.match(migration, /grant execute on function public\.get_learning_content_coverage\(\) to service_role/);
  assert.match(migration, /'deficitTo9Plus'/);
  assert.match(migration, /'coverageStatus'/);
});
