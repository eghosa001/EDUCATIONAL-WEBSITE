import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const migration = readFileSync(
  join(process.cwd(), '..', 'supabase', 'migrations', '20261008160000_full_learning_system_strengthening.sql'),
  'utf8',
);

test('internal and archive tables have explicit no-client RLS posture', () => {
  assert.match(migration, /CREATE POLICY no_client_access/);
  assert.match(migration, /USING \(false\) WITH CHECK \(false\)/);
  assert.match(migration, /ALTER TABLE public\.%I ENABLE ROW LEVEL SECURITY/);
});

test('verified practice foreign keys and learner-facing paths are indexed', () => {
  assert.match(migration, /verified_practice_questions_subject_id_idx/);
  assert.match(migration, /verified_practice_attempts_user_id_idx/);
  assert.match(migration, /verified_practice_attempts_subject_id_idx/);
  assert.match(migration, /verified_practice_active_board_subject_verified_idx/);
  assert.match(migration, /curriculum_questions_active_subject_topic_idx/);
  assert.match(migration, /flashcards_public_subject_idx/);
});

test('learner quiz views never expose answer keys before submission', () => {
  const learnerSafeView = migration.slice(
    migration.indexOf('CREATE OR REPLACE VIEW public.learner_past_questions_quiz_safe'),
    migration.indexOf('CREATE OR REPLACE VIEW public.verified_practice_questions_quiz_safe'),
  );
  const verifiedSafeView = migration.slice(
    migration.indexOf('CREATE OR REPLACE VIEW public.verified_practice_questions_quiz_safe'),
    migration.indexOf('CREATE OR REPLACE VIEW public.learning_question_quality_issues'),
  );

  assert.doesNotMatch(learnerSafeView, /correct_answer/);
  assert.doesNotMatch(learnerSafeView, /explanation[,\s]/);
  assert.doesNotMatch(verifiedSafeView, /correct_answer/);
  assert.doesNotMatch(verifiedSafeView, /explanation[,\s]/);
  assert.match(learnerSafeView, /length\(trim\(question_text\)\)>=12/);
  assert.match(verifiedSafeView, /length\(trim\(question_text\)\)>=12/);
});

test('safe views deduplicate question stems before serving', () => {
  assert.match(migration, /row_number\(\) OVER/);
  assert.match(migration, /PARTITION BY board, subject_id, md5\(lower\(regexp_replace\(trim\(question_text\)/);
  assert.match(migration, /WHERE rn=1/);
});

test('system health and gap reporting are available but service-scoped', () => {
  assert.match(migration, /learning_content_gap_queue/);
  assert.match(migration, /learning_question_quality_issues/);
  assert.match(migration, /learning_question_duplicate_issues/);
  assert.match(migration, /learning_system_health_report/);
  assert.match(migration, /get_learning_system_health/);
  assert.match(migration, /REVOKE EXECUTE ON FUNCTION public\.get_learning_system_health\(\) FROM anon/);
  assert.match(migration, /REVOKE EXECUTE ON FUNCTION public\.get_learning_system_health\(\) FROM authenticated/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION public\.get_learning_system_health\(\) TO service_role/);
});

test('health views use security invoker to avoid accidental privilege escalation', () => {
  assert.match(migration, /ALTER VIEW public\.learner_past_questions_quiz_safe SET \(security_invoker=true\)/);
  assert.match(migration, /ALTER VIEW public\.verified_practice_questions_quiz_safe SET \(security_invoker=true\)/);
  assert.match(migration, /ALTER VIEW public\.learning_system_health_report SET \(security_invoker=true\)/);
});
