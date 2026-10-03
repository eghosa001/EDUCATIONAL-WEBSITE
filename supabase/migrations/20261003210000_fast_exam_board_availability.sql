-- Fast exam-board availability summary used by Exams/JAMB hubs.
create or replace function public.get_past_question_availability()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with eligible as (
    select lower(board) as board, subject_id, year
    from public.past_questions
    where is_active = true
      and question_type = 'mcq'
      and correct_answer is not null
      and lower(board) in ('jamb','waec','neco','nabteb')
  ),
  boards as (
    select
      board,
      array_remove(array_agg(distinct subject_id), null) as subject_ids,
      array_remove(array_agg(distinct year order by year desc), null) as years,
      count(*)::integer as question_count
    from eligible
    group by board
  )
  select coalesce(
    jsonb_object_agg(
      board,
      jsonb_build_object(
        'subjectIds', to_jsonb(subject_ids),
        'years', to_jsonb(years),
        'questionCount', question_count
      )
    ),
    '{}'::jsonb
  )
  from boards;
$$;

revoke all on function public.get_past_question_availability() from public;
grant execute on function public.get_past_question_availability() to anon, authenticated, service_role;
