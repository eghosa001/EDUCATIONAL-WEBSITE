import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const migration = readFileSync('../supabase/migrations/20261008170500_add_verified_practice_volume_to_all_groups.sql', 'utf8');

test('verified-practice volume migration fills every group to 100 without mislabeling past papers', () => {
  assert.match(migration, /greatest\(100 - active_count, 0\)/);
  assert.match(migration, /learning_content_coverage/);
  assert.match(migration, /verified_practice_questions/);
  assert.match(migration, /Published Curriculum Question Bank/);
  assert.match(migration, /Board-Aligned Foundation Practice/);
  assert.match(migration, /not presented as a historical past-paper question/);
  assert.match(migration, /on conflict do nothing/i);
});

test('generated practice remains scoreable, explained and learner-safe', () => {
  assert.match(migration, /jsonb_build_array/);
  assert.match(migration, /correct_answer/);
  assert.match(migration, /'A'/);
  assert.match(migration, /explanation/);
  assert.match(migration, /verified_at/);
  assert.match(migration, /is_active/);
  assert.doesNotMatch(migration, /learner_past_questions\s*\(/i);
  assert.doesNotMatch(migration, /insert\s+into\s+public\.past_questions/i);
});

test('special subjects receive transparent foundation-practice volume', () => {
  for (const subject of ['Information', 'Technical Drawing', 'Applied Electricity', 'Visual Arts']) {
    assert.match(migration, new RegExp(subject.replace(/ /g, '\\s+'), 'i'));
  }
});
