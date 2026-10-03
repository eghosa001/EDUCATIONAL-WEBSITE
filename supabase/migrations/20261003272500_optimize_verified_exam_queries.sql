-- Optimize verified external-exam availability/session queries.
-- Board values are normalized lowercase in the current dataset, so exact equality can use this index.

create index if not exists idx_past_questions_verified_external
on public.past_questions (board, subject_id, year desc)
where is_active = true
  and question_type = 'mcq'
  and correct_answer is not null
  and source like 'storage:%';

create or replace function public.get_past_question_availability()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  with eligible as (
    select board, subject_id, year
    from public.past_questions
    where is_active = true
      and question_type = 'mcq'
      and correct_answer is not null
      and board in ('jamb','waec','neco','nabteb')
      and source like 'storage:%'
  ),
  subject_counts as (
    select board, subject_id, count(*)::integer as question_count
    from eligible where subject_id is not null
    group by board, subject_id
  ),
  board_counts as (
    select board,
      array_agg(subject_id order by subject_id) as subject_ids,
      sum(question_count)::integer as question_count,
      jsonb_object_agg(subject_id::text, question_count order by subject_id::text) as subject_counts
    from subject_counts group by board
  ),
  board_years as (
    select board, array_remove(array_agg(distinct year order by year desc), null) as years
    from eligible group by board
  )
  select coalesce(
    jsonb_object_agg(c.board,jsonb_build_object(
      'subjectIds',to_jsonb(c.subject_ids),
      'years',to_jsonb(coalesce(y.years,array[]::integer[])),
      'questionCount',c.question_count,
      'subjectCounts',c.subject_counts
    )),
    '{}'::jsonb
  )
  from board_counts c left join board_years y using(board);
$function$;

revoke all on function public.get_past_question_availability() from public;
revoke execute on function public.get_past_question_availability() from anon, authenticated;
grant execute on function public.get_past_question_availability() to service_role;
