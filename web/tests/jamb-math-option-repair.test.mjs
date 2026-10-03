import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const extractor = fs.readFileSync(new URL('../../supabase/functions/past-question-extractor/index.ts', import.meta.url), 'utf8');
const repair = fs.readFileSync(new URL('../../scripts/repair_jamb_math_mcq_options.py', import.meta.url), 'utf8');

test('Maths option repair requires two-pass consensus and explicit JAMB source', () => {
  assert.match(extractor, /repair_mcq_options/);
  assert.match(extractor, /pdf-options-ocr-consensus/);
  assert.match(extractor, /consensusPasses < 2/);
  assert.match(extractor, /restricted to explicit JAMB past-question files/);
});

test('Maths option repair only upgrades active unanswered essay rows', () => {
  assert.match(extractor, /row\.question_type !== "essay"/);
  assert.match(extractor, /!row\.is_active/);
  assert.match(extractor, /row\.correct_answer/);
  assert.match(extractor, /question_type: "mcq"/);
  assert.match(extractor, /options-recovered-consensus/);
});

test('Maths recovery requires matching question and option signatures across extraction passes', () => {
  assert.match(repair, /collect_consensus/);
  assert.match(repair, /option_signature/);
  assert.match(repair, /len\(labels\) < 2/);
  assert.match(repair, /Two-pass option-consensus candidates/);
});
