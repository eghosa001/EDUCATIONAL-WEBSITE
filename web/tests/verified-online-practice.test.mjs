import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('verified online practice stays separate from historical past questions', () => {
  const api = read('../../supabase/functions/web-api/index.ts');
  const page = read('../src/app/dashboard/past-questions/page.tsx');
  assert.match(api, /verified_practice_questions/);
  assert.match(api, /\/verified-practice\/session/);
  assert.match(api, /\/verified-practice\/grade/);
  assert.match(api, /not historical past questions/);
  assert.match(page, /verified-practice/);
  assert.match(page, /verified-cbt/);
  assert.match(page, /question\.source === 'exam'/);
});

test('exam hubs expose verified practice without relabelling it as past questions', () => {
  const exams = read('../src/app/dashboard/exams/page.tsx');
  const jamb = read('../src/app/dashboard/jamb/page.tsx');
  assert.match(exams, /Verified Practice/);
  assert.match(exams, /Historical past questions will remain separate/);
  assert.match(jamb, /JAMB Verified Practice/);
  assert.match(jamb, /separate from historical JAMB past questions/);
});

test('verified practice schema records provenance and protects answers', () => {
  const migration = read('../../supabase/migrations/20261004052500_create_verified_online_practice_bank.sql');
  assert.match(migration, /source_url text/);
  assert.match(migration, /verification_method text not null/);
  assert.match(migration, /verified_practice_questions_no_client_access/);
  assert.match(migration, /verified_practice_attempts_own_read/);
});
