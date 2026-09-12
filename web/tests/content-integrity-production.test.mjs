import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');

const seedContent = fs.readFileSync(path.join(repoRoot, 'backend', 'scripts', 'seed-content.js'), 'utf8');
const migration = fs.readFileSync(
  path.join(repoRoot, 'supabase', 'migrations', '20260912180000_content_auth_integrity.sql'),
  'utf8',
);
const curriculumPage = fs.readFileSync(
  path.join(webRoot, 'src', 'app', 'dashboard', 'curriculum', 'page.tsx'),
  'utf8',
);
const authContext = fs.readFileSync(path.join(webRoot, 'src', 'contexts', 'AuthContext.tsx'), 'utf8');

test('structural curriculum seeding never publishes placeholder lessons', () => {
  assert.match(seedContent, /status, price, currency, is_free, is_featured/);
  assert.match(seedContent, /'draft'/);
  assert.match(seedContent, /is_published, estimated_minutes, content_quality/);
  assert.match(seedContent, /TRUE,FALSE,\$9,'needs_review'/);
  assert.doesNotMatch(seedContent, /Study topic:/);
});

test('database migration blocks weak published lessons and malformed active curriculum questions', () => {
  assert.match(migration, /enforce_lesson_publication_quality/);
  assert.match(migration, /written_content, ''\)\) < 700/);
  assert.match(migration, /at least two learning objectives/);
  assert.match(migration, /at least two key points/);
  assert.match(migration, /Template\/generic lesson content cannot be published/);
  assert.match(migration, /enforce_active_question_quality/);
  assert.match(migration, /Active curriculum questions must be linked to a topic/);
  assert.match(migration, /correct answer must reference one of its option IDs/);
});

test('curriculum browser supports searchable, deduplicated level-subject-term-topic navigation', () => {
  assert.match(curriculumPage, /Search subjects/);
  assert.match(curriculumPage, /Search topics/);
  assert.match(curriculumPage, /dedupeTopics/);
  assert.match(curriculumPage, /repeated headings collapsed/);
  assert.match(curriculumPage, /Continue to .* teaching materials/);
});

test('web email login uses Supabase password authentication and normalizes email', () => {
  assert.match(authContext, /signInWithPassword/);
  assert.match(authContext, /email\.trim\(\)\.toLowerCase\(\)/);
  assert.match(authContext, /applySession\(data\.session\)/);
});
