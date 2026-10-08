import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const migration = fs.readFileSync(
  path.join(repoRoot, 'supabase/migrations/20261008193000_expand_lesson_checkpoint_questions.sql'),
  'utf8',
);

describe('lesson content expansion 9+ guardrails', () => {
  it('expands only published course and lesson content', () => {
    assert.match(migration, /from public\.lessons l/);
    assert.match(migration, /join public\.courses c on c\.id = l\.course_id/);
    assert.match(migration, /l\.is_published = true/);
    assert.match(migration, /c\.status = 'published'/);
  });

  it('targets only lessons whose topic has no active question', () => {
    assert.match(migration, /not exists \([\s\S]*from public\.questions q[\s\S]*q\.topic_id = l\.topic_id[\s\S]*q\.is_active = true/);
  });

  it('labels expansion as lesson checkpoint curriculum practice, not historical past paper', () => {
    assert.match(migration, /THE GUIDE Lesson Checkpoint/);
    assert.match(migration, /Lesson Checkpoint Practice/);
    assert.match(migration, /lesson-checkpoint/);
    assert.doesNotMatch(migration, /SOURCE_PAPER:/);
    assert.doesNotMatch(migration, /past_questions/);
  });

  it('creates safe scoreable MCQs with four options and hidden answer keys', () => {
    assert.match(migration, /'mcq'/);
    assert.match(migration, /jsonb_build_array\(/);
    assert.match(migration, /jsonb_build_object\('id', 'A'/);
    assert.match(migration, /jsonb_build_object\('id', 'B'/);
    assert.match(migration, /jsonb_build_object\('id', 'C'/);
    assert.match(migration, /jsonb_build_object\('id', 'D'/);
    assert.match(migration, /to_jsonb\('A'::text\)/);
  });
});
