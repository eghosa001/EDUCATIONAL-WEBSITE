import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(process.cwd(), '..');
const migration = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'migrations', '20261008161000_curriculum_question_volume_9_plus.sql'),
  'utf8',
);

test('curriculum question volume is raised from published lesson content, not fake exam papers', () => {
  assert.match(migration, /THE GUIDE Lesson-Grounded Practice/);
  assert.match(migration, /Curriculum Practice/);
  assert.match(migration, /l\.is_published = true/);
  assert.match(migration, /coalesce\(l\.content_quality, 'ready'\) <> 'needs_review'/);
  assert.match(migration, /length\(coalesce\(l\.written_content, ''\)\) >= 700/);
  assert.doesNotMatch(migration, /SOURCE_PAPER:JAMB|SOURCE_PAPER:WAEC|SOURCE_PAPER:NECO|SOURCE_PAPER:NABTEB/);
});

test('generated curriculum questions satisfy learner-safe MCQ structure', () => {
  assert.match(migration, /question_type/);
  assert.match(migration, /multiple-choice/);
  assert.match(migration, /jsonb_build_object\('id', 'A', 'text', lesson_title\)/);
  assert.match(migration, /jsonb_build_object\('id', 'D', 'text', distractors\[3\]\)/);
  assert.match(migration, /to_jsonb\('A'::text\)/);
  assert.match(migration, /lesson-grounded/);
});

test('coverage gate ignores inactive generic stubs and keeps service-only access', () => {
  assert.match(migration, /NERDC_GENERATED/);
  assert.match(migration, /SYLLABUS_GENERATED/);
  assert.match(migration, /create or replace view public\.learning_content_coverage/);
  assert.match(migration, /security_invoker = true/);
  assert.match(migration, /revoke all on table public\.learning_content_coverage from public, anon, authenticated/);
  assert.match(migration, /grant select on table public\.learning_content_coverage to service_role/);
});
