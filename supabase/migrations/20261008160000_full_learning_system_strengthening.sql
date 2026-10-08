-- Full learning-system hardening pass for the education schema.
-- Does not fabricate historical exam content.

DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'internal_worker_auth','lesson_content_backup_20260831','lesson_content_repair_backup_20260927',
    'lesson_content_repair_backup_20261003','lesson_quality_audits','lesson_worker_control',
    'orphan_lesson_archive_20261004',('password' || '_resets'),
    'secondary_lesson_content_backup_20260831','sessions'
  ] LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      IF NOT EXISTS (
        SELECT 1 FROM pg_policy p
        JOIN pg_class c ON c.oid = p.polrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname='public' AND c.relname=tbl AND p.polname='no_client_access'
      ) THEN
        EXECUTE format('CREATE POLICY no_client_access ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE tbl text; constraint_name text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['orphan_lesson_archive_20261004','secondary_lesson_content_backup_20260831','lesson_content_backup_20260831'] LOOP
    IF to_regclass(format('public.%I', tbl)) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM pg_index i
        JOIN pg_class c ON c.oid=i.indrelid
        JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='public' AND c.relname=tbl AND i.indisprimary
      ) THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns cols
        WHERE cols.table_schema='public' AND cols.table_name=tbl AND cols.column_name='archive_row_id'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN archive_row_id bigserial', tbl);
      END IF;
      constraint_name := left(tbl || '_archive_row_id_pkey', 63);
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I PRIMARY KEY (archive_row_id)', tbl, constraint_name);
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS verified_practice_questions_subject_id_idx ON public.verified_practice_questions(subject_id);
CREATE INDEX IF NOT EXISTS verified_practice_attempts_user_id_idx ON public.verified_practice_attempts(user_id);
CREATE INDEX IF NOT EXISTS verified_practice_attempts_subject_id_idx ON public.verified_practice_attempts(subject_id);
CREATE INDEX IF NOT EXISTS verified_practice_active_board_subject_verified_idx ON public.verified_practice_questions(board, subject_id, verified_at) WHERE is_active=true;
CREATE INDEX IF NOT EXISTS curriculum_questions_active_subject_topic_idx ON public.questions(subject_id, topic_id) WHERE is_active=true;
CREATE INDEX IF NOT EXISTS flashcards_public_subject_idx ON public.flashcards(subject_id) WHERE is_public=true;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY board, subject_id, md5(lower(regexp_replace(trim(question_text),'\s+',' ','g'))) ORDER BY created_at NULLS LAST, id) AS rn
  FROM public.verified_practice_questions WHERE is_active=true
)
UPDATE public.verified_practice_questions v SET is_active=false, updated_at=now()
FROM ranked r WHERE v.id=r.id AND r.rn>1;

UPDATE public.verified_practice_questions SET is_active=false, updated_at=now()
WHERE is_active=true AND (question_text IS NULL OR length(trim(question_text))<12);

UPDATE public.past_questions SET is_active=false, updated_at=now()
WHERE is_active=true AND (question_text IS NULL OR length(trim(question_text))<12)
  AND lower(board::text)=ANY(ARRAY['jamb','waec','neco','nabteb'])
  AND question_type::text='mcq' AND answer_verified_at IS NOT NULL;

CREATE OR REPLACE VIEW public.learner_past_questions_quiz_safe AS
WITH ranked AS (
  SELECT id, board, year, subject_id, topic_id, question_type, question_text, question_image_url, options, difficulty, marks, source, tags, usage_count, created_at, updated_at,
    row_number() OVER (PARTITION BY board, subject_id, md5(lower(regexp_replace(trim(question_text),'\s+',' ','g'))) ORDER BY answer_verified_at DESC NULLS LAST, created_at NULLS LAST, id) AS rn
  FROM public.learner_past_questions
  WHERE is_active=true AND question_text IS NOT NULL AND length(trim(question_text))>=12
    AND answer_verified_at IS NOT NULL AND options IS NOT NULL AND jsonb_typeof(options)='array' AND jsonb_array_length(options)>=4
)
SELECT id, board, year, subject_id, topic_id, question_type, question_text, question_image_url, options, difficulty, marks, source, tags, usage_count, created_at, updated_at
FROM ranked WHERE rn=1;

CREATE OR REPLACE VIEW public.verified_practice_questions_quiz_safe AS
WITH ranked AS (
  SELECT id, board, subject_id, topic_label, question_text, options, difficulty, source_title, source_url, verification_method, verified_at, created_at, updated_at,
    row_number() OVER (PARTITION BY board, subject_id, md5(lower(regexp_replace(trim(question_text),'\s+',' ','g'))) ORDER BY verified_at DESC NULLS LAST, created_at NULLS LAST, id) AS rn
  FROM public.verified_practice_questions
  WHERE is_active=true AND question_text IS NOT NULL AND length(trim(question_text))>=12
    AND verified_at IS NOT NULL AND options IS NOT NULL AND jsonb_typeof(options)='array' AND jsonb_array_length(options)=4
)
SELECT id, board, subject_id, topic_label, question_text, options, difficulty, source_title, source_url, verification_method, verified_at, created_at, updated_at
FROM ranked WHERE rn=1;

ALTER VIEW public.learner_past_questions_quiz_safe SET (security_invoker=true);
ALTER VIEW public.verified_practice_questions_quiz_safe SET (security_invoker=true);

CREATE OR REPLACE VIEW public.learning_question_quality_issues AS
SELECT 'verified_practice_questions'::text AS bank_type, id, board, subject_id, question_text,
  CASE
    WHEN question_text IS NULL OR length(trim(question_text))<12 THEN 'short_or_missing_question_text'
    WHEN options IS NULL OR jsonb_typeof(options)<>'array' OR jsonb_array_length(options)<>4 THEN 'invalid_option_count'
    WHEN correct_answer NOT IN ('A','B','C','D') THEN 'invalid_correct_answer'
    WHEN explanation IS NULL OR length(trim(explanation))<10 THEN 'missing_or_thin_explanation'
    WHEN source_title IS NULL OR length(trim(source_title))<3 THEN 'missing_source_title'
    WHEN verification_method IS NULL OR length(trim(verification_method))<3 THEN 'missing_verification_method'
    WHEN verified_at IS NULL THEN 'missing_verified_at' ELSE 'ok' END AS issue_type,
  created_at, updated_at
FROM public.verified_practice_questions
WHERE is_active=true AND (
  question_text IS NULL OR length(trim(question_text))<12 OR options IS NULL OR jsonb_typeof(options)<>'array' OR jsonb_array_length(options)<>4
  OR correct_answer NOT IN ('A','B','C','D') OR explanation IS NULL OR length(trim(explanation))<10 OR source_title IS NULL OR length(trim(source_title))<3
  OR verification_method IS NULL OR length(trim(verification_method))<3 OR verified_at IS NULL)
UNION ALL
SELECT 'learner_past_questions'::text, id, board::text, subject_id, question_text,
  CASE
    WHEN question_text IS NULL OR length(trim(question_text))<12 THEN 'short_or_missing_question_text'
    WHEN options IS NULL OR jsonb_typeof(options)<>'array' OR jsonb_array_length(options)<4 THEN 'invalid_option_count'
    WHEN correct_answer IS NULL THEN 'missing_correct_answer'
    WHEN answer_verified_at IS NULL THEN 'answer_not_verified'
    WHEN source IS NULL OR length(trim(source))<3 THEN 'missing_source' ELSE 'ok' END,
  created_at, updated_at
FROM public.learner_past_questions
WHERE is_active=true AND (
  question_text IS NULL OR length(trim(question_text))<12 OR options IS NULL OR jsonb_typeof(options)<>'array' OR jsonb_array_length(options)<4
  OR correct_answer IS NULL OR answer_verified_at IS NULL OR source IS NULL OR length(trim(source))<3)
UNION ALL
SELECT 'curriculum_questions'::text, id, COALESCE(exam_name,'curriculum')::text, subject_id, question_text,
  CASE
    WHEN question_text IS NULL OR length(trim(question_text))<12 THEN 'short_or_missing_question_text'
    WHEN question_type IN ('mcq','multiple-choice') AND (options IS NULL OR jsonb_typeof(options)<>'array' OR jsonb_array_length(options)<4) THEN 'invalid_option_count'
    WHEN correct_answer IS NULL THEN 'missing_correct_answer'
    WHEN source IS NULL OR length(trim(source))<3 THEN 'missing_source' ELSE 'ok' END,
  created_at, updated_at
FROM public.questions
WHERE is_active=true AND (
  question_text IS NULL OR length(trim(question_text))<12
  OR (question_type IN ('mcq','multiple-choice') AND (options IS NULL OR jsonb_typeof(options)<>'array' OR jsonb_array_length(options)<4))
  OR correct_answer IS NULL OR source IS NULL OR length(trim(source))<3);
ALTER VIEW public.learning_question_quality_issues SET (security_invoker=true);

CREATE OR REPLACE VIEW public.learning_question_duplicate_issues AS
SELECT 'verified_practice_questions_quiz_safe'::text AS bank_type, board::text, subject_id,
  md5(lower(regexp_replace(trim(question_text),'\s+',' ','g'))) AS question_hash, count(*) AS duplicate_count, array_agg(id ORDER BY created_at) AS question_ids
FROM public.verified_practice_questions_quiz_safe
GROUP BY board, subject_id, md5(lower(regexp_replace(trim(question_text),'\s+',' ','g'))) HAVING count(*)>1
UNION ALL
SELECT 'learner_past_questions_quiz_safe'::text, board::text, subject_id,
  md5(lower(regexp_replace(trim(question_text),'\s+',' ','g'))) AS question_hash, count(*) AS duplicate_count, array_agg(id ORDER BY created_at) AS question_ids
FROM public.learner_past_questions_quiz_safe
GROUP BY board, subject_id, md5(lower(regexp_replace(trim(question_text),'\s+',' ','g'))) HAVING count(*)>1;
ALTER VIEW public.learning_question_duplicate_issues SET (security_invoker=true);

CREATE OR REPLACE VIEW public.learning_content_gap_queue AS
SELECT bank_type, board, subject_id, subject_name, active_count, verified_count, target_9_plus_count, minimum_usable_count,
  deficit_to_9_plus, coverage_status,
  CASE
    WHEN bank_type='learner_past_questions' THEN 'import_source_past_paper_with_answer_key'
    WHEN bank_type='verified_practice_questions' AND coverage_status<>'9+' THEN 'fill_from_verified_source_or_curriculum_practice_with_provenance'
    WHEN bank_type='curriculum_questions' THEN 'generate_from_published_lesson_content_only'
    WHEN bank_type='flashcards' THEN 'add_spaced_revision_cards_from_published_lessons'
    ELSE 'review_content_pipeline' END AS recommended_action,
  CASE WHEN coverage_status='empty' THEN 1 WHEN coverage_status='thin' THEN 2 WHEN coverage_status='usable' THEN 3 ELSE 9 END AS priority_rank
FROM public.learning_content_coverage
WHERE coverage_status<>'9+'
ORDER BY priority_rank, deficit_to_9_plus DESC, bank_type, board, subject_name;
ALTER VIEW public.learning_content_gap_queue SET (security_invoker=true);

CREATE OR REPLACE VIEW public.learning_system_health_report AS
WITH coverage_rollup AS (
  SELECT bank_type, count(*) AS subject_groups,
    count(*) FILTER (WHERE coverage_status='9+') AS groups_9_plus,
    count(*) FILTER (WHERE coverage_status='usable') AS groups_usable,
    count(*) FILTER (WHERE coverage_status='thin') AS groups_thin,
    count(*) FILTER (WHERE coverage_status='empty') AS groups_empty,
    sum(active_count) AS active_count,
    sum(deficit_to_9_plus) AS total_deficit_to_9_plus,
    round((count(*) FILTER (WHERE coverage_status='9+')::numeric/nullif(count(*),0))*10,1) AS score_out_of_10
  FROM public.learning_content_coverage GROUP BY bank_type
), quality AS (
  SELECT bank_type, count(*) AS issue_count FROM public.learning_question_quality_issues GROUP BY bank_type
), duplicates AS (
  SELECT replace(replace(bank_type,'_quiz_safe',''),'_questions','') AS normalized_bank_type, count(*) AS duplicate_groups
  FROM public.learning_question_duplicate_issues GROUP BY replace(replace(bank_type,'_quiz_safe',''),'_questions','')
)
SELECT c.bank_type, c.subject_groups, c.groups_9_plus, c.groups_usable, c.groups_thin, c.groups_empty, c.active_count,
  c.total_deficit_to_9_plus, COALESCE(q.issue_count,0) AS quality_issue_count, COALESCE(d.duplicate_groups,0) AS duplicate_issue_groups,
  c.score_out_of_10,
  CASE
    WHEN c.score_out_of_10>=9 AND COALESCE(q.issue_count,0)=0 AND COALESCE(d.duplicate_groups,0)=0 THEN '9+ clean'
    WHEN c.score_out_of_10>=9 THEN '9+ with cleanup needed'
    WHEN c.score_out_of_10>=7 THEN 'strong but incomplete'
    ELSE 'needs expansion' END AS system_status
FROM coverage_rollup c
LEFT JOIN quality q USING (bank_type)
LEFT JOIN duplicates d ON d.normalized_bank_type=c.bank_type
ORDER BY c.bank_type;
ALTER VIEW public.learning_system_health_report SET (security_invoker=true);

CREATE OR REPLACE FUNCTION public.get_learning_system_health()
RETURNS SETOF public.learning_system_health_report
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.learning_system_health_report;
$$;
REVOKE ALL ON FUNCTION public.get_learning_system_health() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_learning_system_health() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_learning_system_health() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_learning_system_health() TO service_role;

COMMENT ON VIEW public.learner_past_questions_quiz_safe IS 'Learner-safe past-question view: excludes answer keys/explanations and deduplicates stems before serving.';
COMMENT ON VIEW public.verified_practice_questions_quiz_safe IS 'Learner-safe verified-practice view: excludes answer keys/explanations and deduplicates stems before serving.';
COMMENT ON VIEW public.learning_content_gap_queue IS 'Admin/service queue for content gaps by bank, board and subject. Not learner-facing.';
COMMENT ON VIEW public.learning_question_quality_issues IS 'Active learner-facing quality issues across question banks.';
COMMENT ON VIEW public.learning_system_health_report IS 'Aggregate health report across content banks, coverage, quality and duplicate issues.';
