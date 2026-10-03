import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../src/app/dashboard/past-questions/page.tsx', import.meta.url), 'utf8');
const jambService = fs.readFileSync(new URL('../src/services/api/jambService.ts', import.meta.url), 'utf8');
const api = fs.readFileSync(new URL('../../supabase/functions/web-api/index.ts', import.meta.url), 'utf8');
const extractor = fs.readFileSync(new URL('../../supabase/functions/past-question-extractor/index.ts', import.meta.url), 'utf8');
const parser = fs.readFileSync(new URL('../../scripts/ocr_past_questions.py', import.meta.url), 'utf8');
const schema = fs.readFileSync(new URL('../../supabase/migrations/20261003221000_advanced_jamb_cbt.sql', import.meta.url), 'utf8');
const timer = fs.readFileSync(new URL('../../supabase/migrations/20261003225000_save_jamb_answers_atomically.sql', import.meta.url), 'utf8');
const recovery = fs.readFileSync(new URL('../../scripts/recover_jamb_answer_keys.py', import.meta.url), 'utf8');

test('JAMB CBT supports course presets, per-subject counts and one total timer', () => {
  assert.match(page, /Choose course \(optional\)/);
  assert.match(page, /Set questions per subject/);
  assert.match(page, /Total exam time/);
  assert.match(page, /jambQuestionTotal/);
  assert.match(page, /startJambCbtSession/);
  assert.match(jambService, /durationMinutes/);
  assert.match(jambService, /subjects: Array<\{ subjectId: string; count: number \}>/);
});

test('JAMB CBT is server-side, four-subject, English-required and strict past-question provenance', () => {
  assert.match(api, /JAMB CBT requires exactly four subjects/);
  assert.match(api, /Select four different JAMB subjects/);
  assert.match(api, /must include Use of English \/ English Language/);
  assert.match(api, /source\.like\.storage:%/);
  assert.match(api, /source\.like\.JAMB %/);
  assert.match(schema, /jamb_cbt_sessions/);
  assert.match(schema, /questions jsonb not null/);
  assert.match(schema, /revoke all on public\.jamb_cbt_sessions from anon, authenticated/);
});

test('JAMB timer is enforced with answer autosave before expiry', () => {
  assert.match(page, /saveJambCbtAnswer/);
  assert.match(jambService, /\/answer/);
  assert.match(api, /save_jamb_cbt_answer/);
  assert.match(api, /const timedOut=nowMs>expiresMs/);
  assert.match(api, /if\(!timedOut\)/);
  assert.match(timer, /expires_at > now\(\)/);
  assert.match(timer, /jsonb_build_object\(p_question_id, p_answer\)/);
});

test('course presets are advisory and point to JAMB IBASS', () => {
  assert.match(schema, /eligibility\.jamb\.gov\.ng/);
  assert.match(schema, /Verify.*JAMB IBASS/i);
  assert.match(page, /Verify your institution\/course on JAMB IBASS/);
});

test('answer recovery only trusts embedded answer-key PDFs and records provenance', () => {
  assert.match(extractor, /Only embedded PDF answer-key recovery is trusted/);
  assert.match(extractor, /source-pdf-answer-key/);
  assert.match(extractor, /Source file is not explicitly identified as questions-and-answers material/);
  assert.match(parser, /answers = answer_key\(raw\)/);
  assert.match(parser, /markers\[-1\]/);
  assert.match(recovery, /pdf-text-answer-key/);
  assert.doesNotMatch(recovery, /tesseract/i);
});
