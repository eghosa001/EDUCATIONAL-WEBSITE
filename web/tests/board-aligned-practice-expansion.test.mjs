import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const migration = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'migrations', '20261008161000_board_aligned_verified_practice_expansion.sql'),
  'utf8',
);

test('board-aligned expansion fills verified practice only from active scoreable curriculum questions', () => {
  assert.match(migration, /from public\.learning_content_coverage/);
  assert.match(migration, /bank_type='verified_practice_questions'/);
  assert.match(migration, /join public\.questions q on q\.subject_id=d\.subject_id/);
  assert.match(migration, /q\.is_active=true/);
  assert.match(migration, /jsonb_array_length\(q\.options\)=4/);
  assert.match(migration, /q\.correct_answer \?\| array\['A','B','C','D'\]/);
  assert.match(migration, /coalesce\(q\.explanation,''\) <> ''/);
});

test('board-aligned expansion is clearly labelled and not misrepresented as past papers', () => {
  assert.match(migration, /Board-aligned curriculum practice/);
  assert.match(migration, /THE GUIDE Published Curriculum Question Bank/);
  assert.match(migration, /internal:curriculum_questions\//);
  assert.match(migration, /curriculum-grounded-board-practice/);
  assert.doesNotMatch(migration, /source-pdf-answer-key|past paper|historical past/i);
});

test('board-aligned expansion deduplicates against existing verified practice rows', () => {
  assert.match(migration, /not exists \([\s\S]*public\.verified_practice_questions vpq[\s\S]*md5\(vpq\.question_text\)=md5\(q\.question_text\)/);
  assert.match(migration, /distinct on \(d\.board, d\.subject_id, md5\(q\.question_text\)\)/);
  assert.match(migration, /on conflict do nothing/);
});

test('board-aligned expansion respects the 50 question target per board and subject', () => {
  assert.match(migration, /greatest\(50-active_count,0\) as needed/);
  assert.match(migration, /rn <= needed/);
  assert.doesNotMatch(migration, /100-active_count/);
});
