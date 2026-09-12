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
  v_correct_original text;
  v_original_answer text;
  v_display_correct text;
  v_is_correct boolean;
  v_n integer;
  v_off integer;
  v_display_idx integer;
  v_correct_idx integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Answers must be a JSON array';
  end if;

  for r in
    select q.id, q.options, q.correct_answer, q.explanation
    from public.questions q
    join (
      select distinct nullif(x->>'question_id', '')::uuid as question_id
      from jsonb_array_elements(p_answers) x
      where x ? 'question_id'
    ) a on a.question_id = q.id
    where q.is_active = true
      and jsonb_typeof(q.options) = 'array'
      and jsonb_array_length(q.options) >= 2
  loop
    v_total := v_total + 1;

    select x->>'answer'
    into v_student_answer
    from jsonb_array_elements(p_answers) x
    where x->>'question_id' = r.id::text
    limit 1;

    v_n := jsonb_array_length(r.options);
    v_off := (((
      hashtextextended(auth.uid()::text || ':' || r.id::text, 0) % v_n
    ) + v_n) % v_n)::int;

    v_correct_original := r.correct_answer #>> '{}';
    v_original_answer := null;

    if coalesce(v_student_answer, '') ~ '^[A-Z]$' then
      v_display_idx := ascii(v_student_answer) - 65;
      if v_display_idx >= 0 and v_display_idx < v_n then
        v_original_answer := (
          r.options -> (((v_display_idx + v_off) % v_n)::int)
        ) ->> 'id';
      end if;
    end if;

    select idx
    into v_correct_idx
    from generate_series(0, v_n - 1) g(idx)
    where (r.options -> idx) ->> 'id' = v_correct_original
    limit 1;

    if v_correct_idx is not null then
      v_display_correct := chr(
        65 + (((v_correct_idx - v_off) % v_n + v_n) % v_n)
      );
    else
      v_display_correct := v_correct_original;
    end if;

    v_is_correct := coalesce(v_student_answer, '') <> ''
      and v_original_answer = v_correct_original;

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
        'correct_answer', v_display_correct,
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

revoke all on function public.cbt_grade(jsonb) from public;
grant execute on function public.cbt_grade(jsonb) to authenticated;
