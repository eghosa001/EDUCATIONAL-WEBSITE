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
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', chr(65 + g.i),
          'text', coalesce(
            (q.options -> (((g.i + p.off) % p.n)::int)) ->> 'text',
            (q.options -> (((g.i + p.off) % p.n)::int)) ->> 'label',
            (q.options -> (((g.i + p.off) % p.n)::int)) ->> 'value'
          )
        )
        order by g.i
      )
      from generate_series(0, p.n - 1) g(i)
    ) as options,
    q.difficulty,
    q.topic_id
  from public.questions q
  cross join lateral (
    select
      jsonb_array_length(q.options) as n,
      (((
        hashtextextended(auth.uid()::text || ':' || q.id::text, 0)
        % jsonb_array_length(q.options)
      ) + jsonb_array_length(q.options)) % jsonb_array_length(q.options))::int as off
  ) p
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

revoke all on function public.cbt_get_questions(uuid, uuid, integer) from public;
grant execute on function public.cbt_get_questions(uuid, uuid, integer) to authenticated;
