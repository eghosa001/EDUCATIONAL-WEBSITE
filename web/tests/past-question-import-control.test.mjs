import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const migration = readFileSync(
  join(process.cwd(), '..', 'supabase', 'migrations', '20261008173500_past_question_source_import_control.sql'),
  'utf8',
);

test('past-question import backlog separates source import work from learner-safe volume', () => {
  assert.match(migration, /learning_past_question_import_backlog/);
  assert.match(migration, /learning_content_gap_queue/);
  assert.match(migration, /learner_past_questions/);
  assert.match(migration, /past_questions/);
  assert.match(migration, /deficit_to_9_plus/);
  assert.match(migration, /target_9_plus_count/);
});

test('past-question backlog reports concrete source and verification next actions', () => {
  for (const action of [
    'upload_source_paper_pdf_and_answer_key',
    'parse_uploaded_source_documents',
    'import_more_source_papers_with_answer_keys',
    'verify_raw_answers_against_source_key',
    'repair_raw_question_structure_or_options',
    'ready_for_safe_promotion_check',
  ]) {
    assert.match(migration, new RegExp(action));
  }
});

test('verification queue does not expose answer keys while routing bad raw rows', () => {
  assert.match(migration, /learning_past_question_verification_queue/);
  assert.match(migration, /question_preview/);
  assert.match(migration, /issue_codes/);
  assert.match(migration, /missing_answer_key/);
  assert.match(migration, /answer_not_verified/);
  assert.match(migration, /bad_or_missing_options/);

  const queueDefinition = migration.split('create or replace view public.learning_past_question_verification_queue')[1]
    .split('create or replace function public.get_past_question_import_backlog')[0];
  assert.doesNotMatch(queueDefinition, /pq\.correct_answer\s+(?:as\s+)?correct_answer/i);
});

test('import-control views and RPC are service-only', () => {
  assert.match(migration, /with \(security_invoker = true\)/);
  assert.match(migration, /security definer/);
  assert.match(migration, /revoke all on public\.learning_past_question_import_backlog from anon, authenticated/);
  assert.match(migration, /revoke all on public\.learning_past_question_verification_queue from anon, authenticated/);
  assert.match(migration, /revoke all on function public\.get_past_question_import_backlog\(\) from anon, authenticated/);
  assert.match(migration, /grant execute on function public\.get_past_question_import_backlog\(\) to service_role/);
});

test('source-document metadata is used for real import planning', () => {
  assert.match(migration, /public\.documents/);
  assert.match(migration, /active_source_documents/);
  assert.match(migration, /active_pdf_documents/);
  assert.match(migration, /years_with_documents/);
  assert.match(migration, /oldest_document_year/);
  assert.match(migration, /newest_document_year/);
});
