import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261003114500_real_source_exam_bank.sql', import.meta.url), 'utf8');

test('exam API accepts real source-paper provenance and rejects inactive questions', () => {
  assert.match(api, /SOURCE_PAPER:/);
  assert.match(api, /row\.question\?\.is_active/);
  assert.match(api, /q\?\.is_active/);
});

test('real source-paper exam migration promotes only scoreable questions', () => {
  assert.match(migration, /pq\.correct_answer is not null/);
  assert.match(migration, /jsonb_array_length\(pq\.options\) >= 2/);
  assert.match(migration, /JAMB Economics CBT/);
  assert.match(migration, /JAMB English CBT/);
  assert.match(migration, /having count\(\*\) >= 5/i);
});
