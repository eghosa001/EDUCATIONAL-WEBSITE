-- Strict JAMB learner experiences must use only archived source-paper rows.
create or replace function public.get_jamb_subject_availability()
returns table(subject_id uuid, question_count integer)
language sql
stable
security definer
set search_path = public
as $function$
  select pq.subject_id,count(*)::integer
  from public.past_questions pq
  where pq.is_active=true
    and lower(pq.board)='jamb'
    and pq.question_type='mcq'
    and pq.correct_answer is not null
    and pq.source like 'storage:%'
  group by pq.subject_id;
$function$;

create or replace function public.get_past_question_availability()
returns jsonb
language sql
stable
security definer
set search_path = public
as $function$
  with eligible as (
    select lower(board) as board, subject_id, year
    from public.past_questions
    where is_active = true
      and question_type = 'mcq'
      and correct_answer is not null
      and lower(board) in ('jamb','waec','neco','nabteb')
      and (lower(board) <> 'jamb' or source like 'storage:%')
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
$function$;

