import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd().endsWith('/web') ? join(process.cwd(), '..') : process.cwd();
const migration = readFileSync(
  join(root, 'supabase/migrations/20261008173500_past_question_expansion_workflow.sql'),
  'utf8',
);

function has(fragment) {
  assert.ok(
    migration.includes(fragment),
    `Expected migration to contain: ${fragment}`,
  );
}

function notHas(fragment) {
  assert.ok(
    !migration.includes(fragment),
    `Migration must not contain unsafe fragment: ${fragment}`,
  );
}

has('create table if not exists public.past_question_import_batches');
has('create table if not exists public.past_question_answer_verifications');
has('create or replace view public.past_question_source_document_matches');
has('create or replace view public.past_question_expansion_workflow');
has('create or replace view public.past_question_verification_package_queue');
has('create or replace function public.get_past_question_expansion_system()');
has('create or replace function public.record_past_question_answer_verification');
has('create or replace function public.create_past_question_import_batch');

has('with (security_invoker = true)');
has('set search_path = public, pg_temp');
has('alter table public.past_question_import_batches enable row level security');
has('alter table public.past_question_answer_verifications enable row level security');
has('to service_role');
has('revoke all on function public.get_past_question_expansion_system() from public, anon, authenticated');
has('revoke all on function public.record_past_question_answer_verification(uuid, uuid, text, jsonb, text, uuid) from public, anon, authenticated');
has('revoke all on function public.get_past_question_import_backlog() from public, anon, authenticated');

has('answer_source = \'source-pdf-answer-key\'');
has('Source document board does not match question board');
has('Source document subject does not match question subject');
has('Source document year does not match question year');
has('Verified answer must match exactly one option');
has('Question stem is too short for learner-safe promotion');

has('on conflict (lower(board), subject_id) where status in');
has('Auto-seeded by past_question_expansion_workflow_v1');
has('past_question_import_batches_one_open_idx');
has('past_question_import_batches_subject_id_idx');
has('past_question_answer_verifications_source_document_idx');

notHas('insert into public.learner_past_questions');
notHas('insert into public.past_questions');
notHas('Board-aligned foundation practice');
notHas('generated historical past paper');

console.log('past question expansion workflow migration guard passed');
