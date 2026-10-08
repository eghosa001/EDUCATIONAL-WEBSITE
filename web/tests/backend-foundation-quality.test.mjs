import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const webRoot = process.cwd();
const repoRoot = path.resolve(webRoot, '..');
const migrationsRoot = path.join(repoRoot, 'supabase', 'migrations');

const read = (...parts) => fs.readFileSync(path.join(repoRoot, ...parts), 'utf8');
const readMigration = (name) => fs.readFileSync(path.join(migrationsRoot, name), 'utf8');

const backendHardening = readMigration('20261008152000_backend_quality_hardening.sql');
const verifiedBank = readMigration('20261004052500_create_verified_online_practice_bank.sql');
const contentIntegrity = readMigration('20260912180000_content_auth_integrity.sql');
const webApi = read('supabase', 'functions', 'web-api', 'index.ts');

const verifiedSeeds = [
  '20261004052600_seed_verified_practice_jamb.sql',
  '20261004052700_seed_verified_practice_waec.sql',
  '20261004052800_seed_verified_practice_neco.sql',
  '20261004052900_seed_verified_practice_nabteb.sql',
].map((fileName) => [fileName, readMigration(fileName)]);

test('verified-practice database tables are indexed and kept private from direct clients', () => {
  assert.match(backendHardening, /verified_practice_questions_subject_id_idx/);
  assert.match(backendHardening, /verified_practice_attempts_user_id_idx/);
  assert.match(backendHardening, /verified_practice_attempts_subject_id_idx/);
  assert.match(verifiedBank, /alter table public\.verified_practice_questions enable row level security/);
  assert.match(verifiedBank, /verified_practice_questions_no_client_access/);
  assert.match(verifiedBank, /using \(false\) with check \(false\)/);
  assert.match(verifiedBank, /revoke all on table public\.verified_practice_questions from public,anon,authenticated/);
  assert.match(verifiedBank, /create policy verified_practice_attempts_own_read/);
  assert.match(verifiedBank, /using \(\(select auth\.uid\(\)\)=user_id\)/);
});

test('internal worker, reset, session, audit and archive tables have explicit no-client access policies', () => {
  const privateTables = [
    'internal_worker_auth',
    'lesson_content_backup_20260831',
    'lesson_content_repair_backup_20260927',
    'lesson_content_repair_backup_20261003',
    'lesson_quality_audits',
    'lesson_worker_control',
    'orphan_lesson_archive_20261004',
    'password_resets',
    'secondary_lesson_content_backup_20260831',
    'sessions',
  ];
  for (const tableName of privateTables) {
    assert.match(backendHardening, new RegExp(`'${tableName}'`));
  }
  assert.match(backendHardening, /alter table public\.%I enable row level security/);
  assert.match(backendHardening, /create policy %I on public\.%I for all to anon, authenticated using \(false\) with check \(false\)/);
});

test('published lesson and active question quality gates block thin or malformed content', () => {
  assert.match(contentIntegrity, /enforce_lesson_publication_quality/);
  assert.match(contentIntegrity, /Published lesson requires at least 700 characters of written content/);
  assert.match(contentIntegrity, /at least two learning objectives/);
  assert.match(contentIntegrity, /at least two key points/);
  assert.match(contentIntegrity, /Template\/generic lesson content cannot be published/);
  assert.match(contentIntegrity, /enforce_active_question_quality/);
  assert.match(contentIntegrity, /Active curriculum questions must be linked to a topic/);
  assert.match(contentIntegrity, /correct answer must reference one of its option IDs/);
});

test('verified practice question bank requires provenance, explanations, four options and scoreable answers', () => {
  assert.match(verifiedBank, /board text not null check \(board in \('jamb','waec','neco','nabteb'\)\)/);
  assert.match(verifiedBank, /options jsonb not null check \(jsonb_typeof\(options\)='array' and jsonb_array_length\(options\)=4\)/);
  assert.match(verifiedBank, /correct_answer text not null check \(correct_answer in \('A','B','C','D'\)\)/);
  assert.match(verifiedBank, /explanation text not null/);
  assert.match(verifiedBank, /source_title text not null/);
  assert.match(verifiedBank, /verification_method text not null/);
  assert.match(verifiedBank, /verified_at timestamptz not null default now\(\)/);
  assert.match(verifiedBank, /verified_practice_question_unique/);
});

test('verified practice seed content is board-specific, sourced and non-placeholder', () => {
  for (const [fileName, seed] of verifiedSeeds) {
    const board = fileName.match(/seed_verified_practice_(\w+)\.sql/)?.[1];
    assert(board, `Could not infer board from ${fileName}`);
    assert.match(seed, new RegExp(`'${board}'`));
    assert.match(seed, /source_title,source_url,verification_method,verified_at,is_active,updated_at/);
    assert.match(seed, /correct_answer/);
    assert.match(seed, /explanation/);
    assert.doesNotMatch(seed, /lorem ipsum|placeholder|sample question|todo|fixme/i);
  }
});

test('learner-facing question APIs do not expose answer keys before submission', () => {
  const questionsRoute = webApi.match(/if\(request\.method==='GET'&&path==='\/questions'\)\{[\s\S]{0,1400}/)?.[0] ?? '';
  assert.match(questionsRoute, /question_text,question_image_url,options,difficulty,marks,source,exam_year,exam_name,tags/);
  assert.doesNotMatch(questionsRoute, /correct_answer|correctAnswer|answer_key|answerKey/);

  assert.match(webApi, /submitted_at:new Date\(\)\.toISOString\(\)/);
  assert.match(webApi, /score:correct/);
  assert.match(webApi, /correct_answer:expected/);
  assert.match(webApi, /explanation:String\(question\.explanation\|\|''\)\|\|null/);
});
