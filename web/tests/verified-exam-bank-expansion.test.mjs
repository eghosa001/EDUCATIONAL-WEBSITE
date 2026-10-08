import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const migration = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'migrations', '20261008163500_expand_verified_exam_banks.sql'),
  'utf8',
);

test('learner-safe past-question promotion only uses source-backed scoreable rows', () => {
  assert.match(migration, /from public\.past_questions p/);
  assert.match(migration, /p\.source like 'storage:%'/);
  assert.match(migration, /p\.question_type='mcq'/);
  assert.match(migration, /jsonb_array_length\(p\.options\) between 4 and 5/);
  assert.match(migration, /trim\(both '\"' from p\.correct_answer::text\) ~ '\^\[A-E\]\$'/);
  assert.match(migration, /not exists \([\s\S]*from public\.learner_past_questions lpq/);
  assert.match(migration, /'source-pdf-answer-key'/);
  assert.match(migration, /answer_verified_at=now\(\)/);
});

test('verified-practice expansion comes only from learner-safe answer-verified rows', () => {
  assert.match(migration, /from public\.learner_past_questions lpq/);
  assert.match(migration, /lpq\.answer_verified_at is not null/);
  assert.match(migration, /lpq\.is_active=true/);
  assert.match(migration, /jsonb_array_length\(lpq\.options\)=4/);
  assert.match(migration, /trim\(both '\"' from lpq\.correct_answer::text\) ~ '\^\[A-D\]\$'/);
  assert.match(migration, /not exists \([\s\S]*from public\.verified_practice_questions vpq/);
});

test('verified-practice expansion is capped at the 9 plus threshold and keeps source-key provenance', () => {
  assert.match(migration, /where rn <= greatest\(50-current_count,0\)/);
  assert.match(migration, /upper\(board\) \|\| ' source-paper answer-key bank'/);
  assert.match(migration, /source-paper answer key identifies option/);
  assert.match(migration, /verification_method/);
  assert.match(migration, /verified_at/);
});
