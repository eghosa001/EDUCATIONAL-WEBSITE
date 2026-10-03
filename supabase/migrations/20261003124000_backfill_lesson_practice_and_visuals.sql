-- Backfill every published lesson with a persisted grounded practice set
-- and a generated visual-summary image. These are derived only from the lesson's
-- own content/objectives; no unsupported facts are introduced.

create extension if not exists pgcrypto;

create unique index if not exists lesson_resources_visual_summary_unique
  on public.lesson_resources (lesson_id, resource_type)
  where resource_type = 'visual-summary';

-- One short resource URL per published lesson. The Next.js route renders
-- the SVG dynamically from the lesson's own objectives/key points.
insert into public.lesson_resources (
  lesson_id,title,resource_type,file_url,file_size_bytes,mime_type,description,is_downloadable,order_index
)
select
  l.id,
  'Lesson visual summary',
  'visual-summary',
  '/lesson-visuals/' || l.id::text,
  null,
  'image/svg+xml',
  'Concept-map image generated directly from this lesson''s objectives and key points.',
  true,
  0
from public.lessons l
where l.is_published=true
  and not exists (
    select 1 from public.lesson_resources r
    where r.lesson_id=l.id and r.resource_type='visual-summary'
  );

-- High-quality grounded cloze items for lessons with enough distinct concepts.
with line_matches as (
  select
    l.id as lesson_id,
    l.title,
    l.written_content,
    l.teaching_version,
    trim(m.caps[1]) as raw_line,
    trim(m.caps[2]) as answer,
    m.ord
  from public.lessons l
  cross join lateral regexp_matches(
    l.written_content,
    '(?m)^([^\n]*\*\*([^*\n]{2,80})\*\*[^\n]*)',
    'g'
  ) with ordinality as m(caps,ord)
  where l.is_published=true
    and length(trim(m.caps[1])) between 40 and 520
),
stats as (
  select lesson_id,
         count(*) as usable,
         count(distinct answer) as distinct_terms
  from line_matches
  group by lesson_id
),
eligible as (
  select lesson_id
  from stats
  where usable >= 5 and distinct_terms >= 4
),
ranked as (
  select
    lm.*,
    row_number() over(partition by lm.lesson_id order by lm.ord, lm.answer) as qn
  from line_matches lm
  join eligible e on e.lesson_id=lm.lesson_id
),
first_five as (
  select * from ranked where qn <= 5
),
prepared as (
  select
    q.lesson_id,
    q.title,
    q.written_content,
    q.teaching_version,
    q.qn,
    q.answer,
    trim(regexp_replace(replace(q.raw_line,'**'||q.answer||'**','____'),'[*_#>~]','','g')) as prompt_line,
    trim(regexp_replace(q.raw_line,'[*_#>~]','','g')) as explanation_line,
    d.distractors
  from first_five q
  cross join lateral (
    select array_agg(answer order by answer) as distractors
    from (
      select distinct lm2.answer
      from line_matches lm2
      where lm2.lesson_id=q.lesson_id
        and lower(lm2.answer) <> lower(q.answer)
      order by lm2.answer
      limit 3
    ) x
  ) d
  where cardinality(d.distractors)=3
),
items as (
  select
    lesson_id,title,written_content,teaching_version,qn,
    jsonb_build_object(
      'questionText', 'Complete this statement from "' || left(title,180) || '": "' || left(prompt_line,520) || '"',
      'questionType', 'multiple-choice',
      'options',
        case ((qn-1) % 4)
          when 0 then jsonb_build_array(answer,distractors[1],distractors[2],distractors[3])
          when 1 then jsonb_build_array(distractors[1],answer,distractors[2],distractors[3])
          when 2 then jsonb_build_array(distractors[1],distractors[2],answer,distractors[3])
          else jsonb_build_array(distractors[1],distractors[2],distractors[3],answer)
        end,
      'correctAnswer', answer,
      'explanation', 'The lesson states: "' || left(explanation_line,520) || '"',
      'difficulty', case when qn <= 2 then 'easy' when qn <= 4 then 'medium' else 'hard' end
    ) as question
  from prepared
),
sets as (
  select
    lesson_id,
    encode(digest(
      left(trim(max(title)),2000) || E'\n---\n' ||
      left(trim(max(written_content)),100000) || E'\n---\n' ||
      coalesce(max(teaching_version),0)::text,
      'sha256'
    ),'hex') as fingerprint,
    jsonb_agg(question order by qn) as questions
  from items
  group by lesson_id
  having count(*)=5
)
insert into public.lesson_practice_sets (
  lesson_id,content_fingerprint,questions,generation_method,source_version,updated_at
)
select lesson_id,fingerprint,questions,'grounded-fallback',2,now()
from sets
on conflict (lesson_id) do update
set content_fingerprint=excluded.content_fingerprint,
    questions=excluded.questions,
    generation_method=excluded.generation_method,
    source_version=excluded.source_version,
    updated_at=now();

-- Safety-net practice for the small number of published lessons that do not
-- contain enough markdown emphasis for five cloze items. These are upgraded
-- by the AI path on first use (source_version=0) but are usable immediately.
with missing as (
  select
    l.id,
    l.course_id,
    l.title,
    l.written_content,
    l.teaching_version,
    left(trim(coalesce(l.key_points->>0,l.learning_objectives->>0,l.description,l.title)),520) as correct_statement
  from public.lessons l
  where l.is_published=true
    and not exists (select 1 from public.lesson_practice_sets ps where ps.lesson_id=l.id)
),
with_distractors as (
  select
    m.*,
    d.distractors
  from missing m
  cross join lateral (
    select array_agg(statement order by priority,sort_key) as distractors
    from (
      select statement,priority,sort_key
      from (
        select distinct on (statement)
          left(trim(coalesce(o.key_points->>0,o.learning_objectives->>0,o.description,o.title)),520) as statement,
          case when o.course_id=m.course_id then 0 else 1 end as priority,
          md5(o.id::text || m.id::text) as sort_key
        from public.lessons o
        where o.is_published=true
          and o.id<>m.id
          and length(trim(coalesce(o.key_points->>0,o.learning_objectives->>0,o.description,o.title))) >= 8
          and lower(trim(coalesce(o.key_points->>0,o.learning_objectives->>0,o.description,o.title))) <> lower(m.correct_statement)
        order by statement,priority,sort_key
      ) distinct_rows
      order by priority,sort_key
      limit 3
    ) picked
  ) d
  where cardinality(d.distractors)=3
),
fallback_items as (
  select
    m.id as lesson_id,
    m.title,
    m.written_content,
    m.teaching_version,
    g.qn,
    jsonb_build_object(
      'questionText', 'Which statement is taught in "' || left(m.title,180) || '"? Practice item ' || g.qn,
      'questionType', 'multiple-choice',
      'options',
        case ((g.qn-1) % 4)
          when 0 then jsonb_build_array(m.correct_statement,m.distractors[1],m.distractors[2],m.distractors[3])
          when 1 then jsonb_build_array(m.distractors[1],m.correct_statement,m.distractors[2],m.distractors[3])
          when 2 then jsonb_build_array(m.distractors[1],m.distractors[2],m.correct_statement,m.distractors[3])
          else jsonb_build_array(m.distractors[1],m.distractors[2],m.distractors[3],m.correct_statement)
        end,
      'correctAnswer', m.correct_statement,
      'explanation', 'This statement comes directly from the lesson''s recorded key points or learning objectives: "' || m.correct_statement || '"',
      'difficulty', case when g.qn<=2 then 'easy' when g.qn<=4 then 'medium' else 'hard' end
    ) as question
  from with_distractors m
  cross join generate_series(1,5) g(qn)
),
fallback_sets as (
  select
    lesson_id,
    encode(digest(
      left(trim(max(title)),2000) || E'\n---\n' ||
      left(trim(max(written_content)),100000) || E'\n---\n' ||
      coalesce(max(teaching_version),0)::text,
      'sha256'
    ),'hex') as fingerprint,
    jsonb_agg(question order by qn) as questions
  from fallback_items
  group by lesson_id
)
insert into public.lesson_practice_sets (
  lesson_id,content_fingerprint,questions,generation_method,source_version,updated_at
)
select lesson_id,fingerprint,questions,'grounded-fallback',0,now()
from fallback_sets
on conflict (lesson_id) do nothing;
