-- Keep learner-facing historical exam data provenance-safe and hide answer keys
-- from direct browser table reads. Learners use the service-role web-api sessions.

-- Quarantine old synthetic/unverified board-year seed rows. These lack archived
-- storage provenance and must never be presented as historical past questions.
update public.past_questions
set is_active = false,
    updated_at = now()
where is_active = true
  and lower(board) in ('jamb','waec','neco','nabteb')
  and source ~* '^(JAMB|WAEC|NECO|NABTEB)[[:space:]]+[0-9]{4}$'
  and answer_verified_at is null;

update public.questions
set is_active = false,
    updated_at = now()
where is_active = true
  and lower(coalesce(exam_name,'')) in ('jamb','waec','neco','nabteb')
  and source ~* '^(JAMB|WAEC|NECO|NABTEB)[[:space:]]+[0-9]{4}$';

-- Direct table reads expose answer-bearing columns. Retire the legacy public
-- read policy and grants; server-side service-role code remains the only learner
-- delivery path.
drop policy if exists past_questions_select_all on public.past_questions;
revoke select on table public.past_questions from anon, authenticated;
grant select on table public.past_questions to service_role;

-- A scoreable archive row must be active, storage-backed, objective, and its
-- stored answer must resolve to exactly one available option.
create or replace view public.learner_past_questions
with (security_invoker = true)
as
select pq.*
from public.past_questions pq
where pq.is_active = true
  and lower(pq.board) in ('jamb','waec','neco','nabteb')
  and pq.question_type = 'mcq'
  and pq.correct_answer is not null
  and pq.source like 'storage:%'
  and jsonb_typeof(pq.options) = 'array'
  and jsonb_array_length(pq.options) >= 2
  and (
    select count(*)
    from jsonb_array_elements(pq.options) as opt
    where lower(trim(coalesce(
      opt->>'id',
      opt->>'value',
      opt->>'label',
      opt->>'text',
      opt#>>'{}'
    ))) = lower(trim(coalesce(
      pq.correct_answer->>'id',
      pq.correct_answer->>'value',
      pq.correct_answer->>'label',
      pq.correct_answer->>'answer',
      pq.correct_answer#>>'{}'
    )))
  ) = 1;

revoke all on table public.learner_past_questions from public, anon, authenticated;
grant select on table public.learner_past_questions to service_role;

create or replace function public.get_jamb_subject_availability()
returns table(subject_id uuid, question_count integer)
language sql
stable
security definer
set search_path = public
as $function$
  select pq.subject_id, count(*)::integer
  from public.learner_past_questions pq
  where lower(pq.board) = 'jamb'
    and pq.subject_id is not null
  group by pq.subject_id;
$function$;

revoke all on function public.get_jamb_subject_availability() from public;
revoke execute on function public.get_jamb_subject_availability() from anon, authenticated;
grant execute on function public.get_jamb_subject_availability() to service_role;

create or replace function public.get_past_question_availability()
returns jsonb
language sql
stable
security definer
set search_path = public
as $function$
  with eligible as (
    select lower(board) as board, subject_id, year
    from public.learner_past_questions
  ),
  subject_counts as (
    select board, subject_id, count(*)::integer as question_count
    from eligible
    where subject_id is not null
    group by board, subject_id
  ),
  board_counts as (
    select
      board,
      array_agg(subject_id order by subject_id) as subject_ids,
      sum(question_count)::integer as question_count,
      jsonb_object_agg(subject_id::text, question_count order by subject_id::text) as subject_counts
    from subject_counts
    group by board
  ),
  board_years as (
    select
      board,
      array_remove(array_agg(distinct year order by year desc), null) as years
    from eligible
    group by board
  )
  select coalesce(
    jsonb_object_agg(
      c.board,
      jsonb_build_object(
        'subjectIds', to_jsonb(c.subject_ids),
        'years', to_jsonb(coalesce(y.years, array[]::integer[])),
        'questionCount', c.question_count,
        'subjectCounts', c.subject_counts
      )
    ),
    '{}'::jsonb
  )
  from board_counts c
  left join board_years y using (board);
$function$;

revoke all on function public.get_past_question_availability() from public;
revoke execute on function public.get_past_question_availability() from anon, authenticated;
grant execute on function public.get_past_question_availability() to service_role;
