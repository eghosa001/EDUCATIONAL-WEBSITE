-- Fill the small remainder that could not get three unique same-course distractors
-- in the main lesson-practice backfill.

with missing as (
  select
    l.id,
    l.title,
    l.written_content,
    l.teaching_version,
    array(
      select distinct statement
      from unnest(array[
        nullif(trim(l.key_points->>0),''),
        nullif(trim(l.key_points->>1),''),
        nullif(trim(l.key_points->>2),''),
        nullif(trim(l.learning_objectives->>0),''),
        nullif(trim(l.learning_objectives->>1),''),
        nullif(trim(l.learning_objectives->>2),''),
        nullif(trim(l.description),''),
        nullif(trim(l.title),'')
      ]) statement
      where statement is not null and length(statement)>=8
      limit 8
    ) as own_statements
  from public.lessons l
  where l.is_published=true
    and not exists (select 1 from public.lesson_practice_sets ps where ps.lesson_id=l.id)
),
global_pool as (
  select array_agg(statement order by sort_key) as statements
  from (
    select distinct
      left(trim(coalesce(l.key_points->>0,l.learning_objectives->>0,l.description,l.title)),520) as statement,
      md5(l.id::text) as sort_key
    from public.lessons l
    where l.is_published=true
      and length(trim(coalesce(l.key_points->>0,l.learning_objectives->>0,l.description,l.title)))>=8
    order by statement,sort_key
    limit 120
  ) p
),
prepared as (
  select
    m.*,
    case when cardinality(m.own_statements)>0 then m.own_statements else array[left(m.title,520)] end as answers,
    d.distractors
  from missing m
  cross join global_pool gp
  cross join lateral (
    select array_agg(statement order by sort_key) as distractors
    from (
      select statement,md5(statement || m.id::text) sort_key
      from unnest(gp.statements) statement
      where not exists (
        select 1
        from unnest(case when cardinality(m.own_statements)>0 then m.own_statements else array[left(m.title,520)] end) own
        where lower(own)=lower(statement)
      )
      order by sort_key
      limit 3
    ) x
  ) d
  where cardinality(d.distractors)=3
),
items as (
  select
    p.id lesson_id,p.title,p.written_content,p.teaching_version,g.qn,
    left(p.answers[((g.qn-1)%greatest(cardinality(p.answers),1))+1],520) correct_statement,
    p.distractors
  from prepared p
  cross join generate_series(1,5) g(qn)
),
sets as (
  select
    lesson_id,
    encode(digest(
      left(trim(max(title)),2000) || E'\n---\n' ||
      left(trim(max(written_content)),100000) || E'\n---\n' ||
      coalesce(max(teaching_version),0)::text,
      'sha256'
    ),'hex') fingerprint,
    jsonb_agg(
      jsonb_build_object(
        'questionText',
          case qn
            when 1 then 'Which statement is taught in "'||left(title,180)||'"?'
            when 2 then 'Which idea correctly belongs to the lesson "'||left(title,180)||'"?'
            when 3 then 'Choose the statement that matches the lesson "'||left(title,180)||'".'
            when 4 then 'Which point should a learner retain from "'||left(title,180)||'"?'
            else 'Which statement accurately reflects "'||left(title,180)||'"?'
          end,
        'questionType','multiple-choice',
        'options',
          case ((qn-1)%4)
            when 0 then jsonb_build_array(correct_statement,distractors[1],distractors[2],distractors[3])
            when 1 then jsonb_build_array(distractors[1],correct_statement,distractors[2],distractors[3])
            when 2 then jsonb_build_array(distractors[1],distractors[2],correct_statement,distractors[3])
            else jsonb_build_array(distractors[1],distractors[2],distractors[3],correct_statement)
          end,
        'correctAnswer',correct_statement,
        'explanation','This answer is grounded in the lesson''s stored objectives, key points or description: "'||correct_statement||'"',
        'difficulty',case when qn<=2 then 'easy' when qn<=4 then 'medium' else 'hard' end
      )
      order by qn
    ) questions
  from items
  group by lesson_id
)
insert into public.lesson_practice_sets(
  lesson_id,content_fingerprint,questions,generation_method,source_version,updated_at
)
select lesson_id,fingerprint,questions,'grounded-fallback',0,now()
from sets
on conflict (lesson_id) do nothing;
