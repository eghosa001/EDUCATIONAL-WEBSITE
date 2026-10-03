import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const practice = fs.readFileSync(new URL('../../supabase/functions/lesson-practice/index.ts', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const migration = fs.readFileSync(new URL('../../supabase/migrations/20261003194000_remove_obsolete_lesson_practice_cache.sql', import.meta.url), 'utf8');

test('generic lesson-practice seed fallback is permanently removed', () => {
  assert.doesNotMatch(practice, /cachedFallback/);
  assert.match(migration, /source_version < 2/);
  assert.match(practice, /source_version: 2/);
});

test('deterministic fallback has a robust lesson-text cloze strategy', () => {
  assert.match(practice, /sentenceTerms/);
  assert.match(practice, /Complete this fact from/);
  assert.match(practice, /Lesson content could not produce a safe grounded practice set/);
});

test('class practice avoids batch AI generation', () => {
  assert.match(practice, /const allowAi = body\.allowAi !== false/);
  assert.match(practice, /bynaraKey && allowAi/);
  assert.match(api, /allowAi:false/);
});
