import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..', '..');
const migrationPath = path.join(repoRoot, 'supabase/migrations/20261008185000_past_question_answer_key_ingestion_system.sql');
const sql = fs.readFileSync(migrationPath, 'utf8');

describe('past question answer key ingestion system', () => {
  it('adds service-only answer key import tables instead of fake historical past papers', () => {
    expect(sql).toContain('create table if not exists public.past_question_answer_key_imports');
    expect(sql).toContain('create table if not exists public.past_question_answer_key_import_items');
    expect(sql).not.toMatch(/insert\s+into\s+public\.past_questions/i);
    expect(sql).not.toMatch(/insert\s+into\s+public\.learner_past_questions/i);
  });

  it('keeps answer key imports private to service role', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('for all to anon, authenticated');
    expect(sql).toContain('using (false)');
    expect(sql).toContain('revoke all on public.past_question_answer_key_imports from public, anon, authenticated');
    expect(sql).toContain('revoke all on public.past_question_answer_key_import_items from public, anon, authenticated');
    expect(sql).toContain('grant select, insert, update on public.past_question_answer_key_imports to service_role');
    expect(sql).toContain('grant select, insert, update on public.past_question_answer_key_import_items to service_role');
  });

  it('creates an import template that requires scoreable rows and candidate source documents', () => {
    expect(sql).toContain('create or replace view public.past_question_answer_key_import_template');
    expect(sql).toContain('with (security_invoker = true)');
    expect(sql).toContain('jsonb_array_length(pq.options) >= 4');
    expect(sql).toContain("answer_key_status");
    expect(sql).toContain('candidate_source_documents');
  });

  it('adds a guarded source-backed verification function', () => {
    expect(sql).toContain('record_past_question_answer_key_verification');
    expect(sql).toContain("answer_key_must_be_A_to_E");
    expect(sql).toContain('answer_key_not_present_in_options');
    expect(sql).toContain('source_document_board_mismatch');
    expect(sql).toContain('source_document_year_mismatch');
    expect(sql).toContain('source_document_subject_mismatch');
    expect(sql).toContain('source_document_answer_key_import');
    expect(sql).toContain('set search_path = public, pg_temp');
  });

  it('only promotes answers after validation and records provenance', () => {
    expect(sql).toContain('update public.past_questions');
    expect(sql).toContain('answer_verified_at = now()');
    expect(sql).toContain('insert into public.past_question_answer_verifications');
    expect(sql).toContain('verified_answer');
    expect(sql).toContain('source_document_id');
  });

  it('adds FK indexes for the new workflow tables', () => {
    expect(sql).toContain('past_question_answer_key_imports_batch_idx');
    expect(sql).toContain('past_question_answer_key_imports_source_document_idx');
    expect(sql).toContain('past_question_answer_key_imports_subject_id_idx');
    expect(sql).toContain('past_question_answer_key_items_import_idx');
    expect(sql).toContain('past_question_answer_key_items_question_idx');
  });
});
