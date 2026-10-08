import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const migrationPath = path.join(repoRoot, 'supabase/migrations/20261008192500_course_review_question_depth_9_plus.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');

describe('course review depth 9 plus expansion', () => {
  it('creates only clearly labelled course review practice, not historical past papers', () => {
    assert.match(migration, /THE GUIDE Course Review/);
    assert.match(migration, /Course Review Practice/);
    assert.doesNotMatch(migration, /JAMB/i);
    assert.doesNotMatch(migration, /WAEC/i);
    assert.doesNotMatch(migration, /NECO/i);
    assert.doesNotMatch(migration, /NABTEB/i);
    assert.doesNotMatch(migration, /past paper/i);
  });

  it('targets published courses below the 10 question depth standard', () => {
    assert.match(migration, /10-active_question_count/);
    assert.match(migration, /where active_question_count < 10/i);
    assert.match(migration, /c\.status='published'/);
    assert.match(migration, /l\.is_published=true/);
  });

  it('uses real lesson and course titles for scoreable MCQ options', () => {
    assert.match(migration, /jsonb_build_array/);
    assert.match(migration, /jsonb_build_object\('id','A','text',lesson_title\)/);
    assert.match(migration, /to_jsonb\('A'::text\)/);
    assert.match(migration, /question_type/);
    assert.match(migration, /'mcq'/);
  });

  it('is idempotent by course and slot tags', () => {
    assert.match(migration, /course-review/);
    assert.match(migration, /'course:' \|\| course_id::text/);
    assert.match(migration, /'slot:' \|\| review_index::text/);
    assert.match(migration, /not exists/i);
  });
});
