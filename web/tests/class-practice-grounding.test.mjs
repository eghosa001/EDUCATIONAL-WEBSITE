import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const sessionMigration = fs.readFileSync(new URL('../../supabase/migrations/20261003181500_add_class_practice_sessions.sql', import.meta.url), 'utf8');
const hardeningMigration = fs.readFileSync(new URL('../../supabase/migrations/20261003182500_harden_class_practice_sessions.sql', import.meta.url), 'utf8');

test('class practice no longer uses the empty legacy class question RPC', () => {
  assert.doesNotMatch(page, /cbt_get_questions/);
  assert.doesNotMatch(page, /cbt_grade/);
  assert.match(page, /class-practice\/session/);
  assert.match(page, /classPracticeSessionId/);
});

test('class practice uses upgraded lesson-grounded practice sets only', () => {
  assert.match(api, /functions\/v1\/lesson-practice/);
  assert.match(api, /source_version/);
  assert.match(api, /Number\(set\.source_version\|\|0\)<2/);
  assert.match(api, /generation_method/);
});

test('answer keys remain in service-only session storage', () => {
  assert.match(sessionMigration, /revoke all.*anon,authenticated,service_role/is);
  assert.match(sessionMigration, /grant select,insert,update,delete.*service_role/is);
  assert.match(hardeningMigration, /class_practice_sessions_deny_clients/);
  assert.match(hardeningMigration, /using \(false\)/);
  assert.match(api, /correctOptionId/);
  assert.doesNotMatch(page, /correctOptionId/);
});

test('class practice feeds learner topic analytics after grading', () => {
  assert.match(api, /lesson_practice_attempts/);
  assert.match(api, /practiceIndex/);
  assert.match(api, /selected_answer_id/);
  assert.match(page, /classAvailability/);
});
