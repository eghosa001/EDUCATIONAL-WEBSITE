-- Backend quality hardening for learner-facing CBT, verified practice, and internal tables.
-- Generated after Supabase advisor scan on 2026-10-08.

-- Cover foreign keys used by verified-practice question lookup and attempt history.
create index if not exists verified_practice_questions_subject_id_idx
  on public.verified_practice_questions(subject_id);

create index if not exists verified_practice_attempts_user_id_idx
  on public.verified_practice_attempts(user_id);

create index if not exists verified_practice_attempts_subject_id_idx
  on public.verified_practice_attempts(subject_id);

-- Make intentionally private/internal tables explicit so RLS is not ambiguous.
-- service_role bypasses RLS; learners/anonymous users must not read or mutate these tables directly.
do $$
declare
  table_name text;
  policy_name text;
  private_tables text[] := array[
    'internal_worker_auth',
    'lesson_content_backup_20260831',
    'lesson_content_repair_backup_20260927',
    'lesson_content_repair_backup_20261003',
    'lesson_quality_audits',
    'lesson_worker_control',
    'orphan_lesson_archive_20261004',
    'password_resets',
    'secondary_lesson_content_backup_20260831',
    'sessions'
  ];
begin
  foreach table_name in array private_tables loop
    if to_regclass(format('public.%I', table_name)) is not null then
      policy_name := table_name || '_no_client_access';
      execute format('alter table public.%I enable row level security', table_name);
      execute format('drop policy if exists %I on public.%I', policy_name, table_name);
      execute format(
        'create policy %I on public.%I for all to anon, authenticated using (false) with check (false)',
        policy_name,
        table_name
      );
    end if;
  end loop;
end $$;
