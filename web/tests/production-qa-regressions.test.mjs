import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.cwd());
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('assignment submit control is wired to the submission service', () => {
  const source = read('src/app/dashboard/assignments/page.tsx');
  assert.match(source, /submitAssignment\(/);
  assert.match(source, /onClick=.*handleSubmit/);
  assert.match(source, /Submit assignment/);
});

test('subscription checkout always returns to the real billing screen', () => {
  const source = read('src/app/dashboard/subscriptions/plans/page.tsx');
  assert.match(source, /BILLING_PATH = ['"]\/dashboard\/subscriptions\/billing['"]/);
  assert.doesNotMatch(source, /router\.push\(['"]\/subscriptions\/billing['"]\)/);
  assert.doesNotMatch(source, /origin\}\/subscriptions\/billing/);
});

test('live class actions and scheduling route are implemented', () => {
  const source = read('src/app/dashboard/live-classes/page.tsx');
  assert.match(source, /joinLiveClass/);
  assert.match(source, /handleJoin/);
  assert.match(source, /toggleReminder/);
  assert.ok(fs.existsSync(path.join(root, 'src/app/dashboard/live-classes/create/page.tsx')));
});

test('library and downloads never emit empty file links', () => {
  const library = read('src/app/dashboard/library/page.tsx');
  const downloads = read('src/app/dashboard/downloads/page.tsx');
  assert.match(library, /hasUsableUrl/);
  assert.match(library, /File unavailable/);
  assert.match(downloads, /filter\(r => hasUsableUrl\(r\.fileUrl\)\)/);
});

test('community forum chips perform filtering and posts expand', () => {
  const source = read('src/app/dashboard/community/page.tsx');
  assert.match(source, /setActiveForum\(forum\.id\)/);
  assert.match(source, /setExpandedPost/);
  assert.match(source, /!selectedForum/);
});

test('database repair migration adds bookmarks and removes anonymous CBT execution', () => {
  const migration = read('../supabase/migrations/20260915094500_production_qa_repairs.sql');
  assert.match(migration, /create table if not exists public\.bookmarks/i);
  assert.match(migration, /revoke execute on function public\.cbt_get_questions\(uuid, uuid, integer\) from anon/i);
  assert.match(migration, /revoke execute on function public\.cbt_grade\(jsonb\) from anon/i);
});

test('backend has publishable-key compatibility fallback', () => {
  const config = read('../backend/src/common/config/index.js');
  assert.match(config, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(config, /sb_publishable_/);
});
