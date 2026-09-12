drop policy if exists questions_admin_read on public.questions;
drop policy if exists questions_anon_read on public.questions;
drop policy if exists questions_authenticated_read on public.questions;

create policy questions_anon_read
on public.questions
for select
to anon
using (is_active = true);

create policy questions_authenticated_read
on public.questions
for select
to authenticated
using (is_active = true);

revoke all privileges on table public.questions from anon, authenticated;
grant select (
  id,
  subject_id,
  topic_id,
  subtopic_id,
  class_id,
  question_type,
  question_text,
  question_image_url,
  options,
  difficulty,
  marks,
  negative_marks,
  time_limit_seconds,
  source,
  exam_year,
  exam_name,
  tags,
  is_active,
  usage_count,
  created_by,
  reviewed_by,
  reviewed_at,
  created_at,
  updated_at
) on public.questions to anon, authenticated;

create or replace function public.cbt_get_questions(
  p_class_id uuid,
  p_subject_id uuid,
  p_count integer default 20
)
returns table(
  id uuid,
  question_text text,
  options jsonb,
  difficulty varchar,
  topic_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := greatest(5, least(coalesce(p_count, 20), 50));
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    q.id,
    q.question_text,
    q.options,
    q.difficulty,
    q.topic_id
  from public.questions q
  where q.is_active = true
    and q.class_id = p_class_id
    and q.subject_id = p_subject_id
    and q.question_type in ('mcq', 'multiple_choice')
    and jsonb_typeof(q.options) = 'array'
    and jsonb_array_length(q.options) >= 2
  order by random()
  limit v_count;
end;
$$;

create or replace function public.cbt_grade(p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total integer := 0;
  v_answered integer := 0;
  v_correct integer := 0;
  v_results jsonb := '[]'::jsonb;
  r record;
  v_student_answer text;
  v_correct_answer text;
  v_is_correct boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Answers must be a JSON array';
  end if;

  for r in
    select q.id, q.correct_answer, q.explanation
    from public.questions q
    join (
      select distinct nullif(x->>'question_id', '')::uuid as question_id
      from jsonb_array_elements(p_answers) x
      where x ? 'question_id'
    ) a on a.question_id = q.id
    where q.is_active = true
  loop
    v_total := v_total + 1;

    select x->>'answer'
    into v_student_answer
    from jsonb_array_elements(p_answers) x
    where x->>'question_id' = r.id::text
    limit 1;

    v_correct_answer := r.correct_answer #>> '{}';
    v_is_correct := coalesce(v_student_answer, '') <> ''
      and v_student_answer = v_correct_answer;

    if coalesce(v_student_answer, '') <> '' then
      v_answered := v_answered + 1;
    end if;

    if v_is_correct then
      v_correct := v_correct + 1;
    end if;

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'question_id', r.id,
        'is_correct', v_is_correct,
        'correct_answer', v_correct_answer,
        'explanation', r.explanation
      )
    );
  end loop;

  return jsonb_build_object(
    'total', v_total,
    'answered', v_answered,
    'correct', v_correct,
    'incorrect', greatest(v_answered - v_correct, 0),
    'unanswered', greatest(v_total - v_answered, 0),
    'percentage', case
      when v_total > 0 then round((v_correct::numeric * 100) / v_total, 2)
      else 0
    end,
    'results', v_results
  );
end;
$$;

revoke all on function public.cbt_get_questions(uuid, uuid, integer) from public;
revoke all on function public.cbt_grade(jsonb) from public;
grant execute on function public.cbt_get_questions(uuid, uuid, integer) to authenticated;
grant execute on function public.cbt_grade(jsonb) to authenticated;
