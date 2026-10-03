import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const extractor = fs.readFileSync(new URL('../../supabase/functions/past-question-extractor/index.ts', import.meta.url), 'utf8');
const consensus = fs.readFileSync(new URL('../../scripts/recover_jamb_ocr_answer_keys.py', import.meta.url), 'utf8');
const literature = fs.readFileSync(new URL('../../supabase/migrations/20261003231500_correct_jamb_literature_mapping.sql', import.meta.url), 'utf8');
const retire = fs.readFileSync(new URL('../../supabase/migrations/20261003232500_retire_legacy_fixed_jamb_exams.sql', import.meta.url), 'utf8');

test('Literature source is mapped to Literature in English', () => {
  assert.match(literature, /Literature in English/);
  assert.match(literature, /8ff55438-3875-42c3-8ef9-7b3cad4c1177/);
  assert.match(literature, /update public\.past_questions/);
  assert.match(literature, /update public\.questions/);
});

test('OCR answer recovery requires two-pass source-key consensus', () => {
  assert.match(extractor, /pdf-answer-key-ocr-consensus/);
  assert.match(extractor, /consensusPasses < 2/);
  assert.match(extractor, /keyEntries < 5/);
  assert.match(extractor, /source-pdf-answer-key-ocr-consensus/);
  assert.match(consensus, /consensus_keys/);
  assert.match(consensus, /count >= 2/);
  assert.match(consensus, /answer_key\(text\)/);
});

test('OCR recovery stays targeted to explicit JAMB past-question source files', () => {
  assert.match(extractor, /answer_key_scan_manifest/);
  assert.match(extractor, /jamb\.\*past\.\*questions\|past\.\*questions\.\*jamb/i);
  assert.match(consensus, /DEFAULT_IDS/);
  assert.match(consensus, /OCR_CONSENSUS_SUMMARY/);
});

test('legacy fixed JAMB exams are retired after dedicated JAMB CBT launch', () => {
  assert.match(retire, /JAMB English CBT/);
  assert.match(retire, /JAMB Economics CBT/);
  assert.match(retire, /is_active=false/);
  assert.match(retire, /is_public=false/);
});
