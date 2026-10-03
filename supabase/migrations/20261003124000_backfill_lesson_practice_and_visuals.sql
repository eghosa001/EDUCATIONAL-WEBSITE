-- Guarantee every published lesson has a visual resource and an immediate,
-- persisted practice set. Seed practice is lesson-grounded and source_version=0,
-- so lesson-practice upgrades it to the richer AI/cloze set on first use.

create extension if not exists pgcrypto;

create unique index if not exists lesson_resources_visual_summary_unique
  on public.lesson_resources (lesson_id, resource_type)
  where resource_type = 'visual-summary';

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

with lesson_seed as (
  select
    l.id,
    l.course_id,
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
        nullif(trim(l.description),'')
      ]) statement
      where statement is not null and length(statement) >= 8
      limit 6
    ) as own_statements,
    left(trim(coalesce(l.key_points->>0,l.learning_objectives->>0,l.description,l.title)),520) as primary_statement
  from public.lessons l
  where l.is_published=true
),
course_pool as (
  select
    course_id,
    array_agg(primary_statement order by id) filter(where primary_statement is not null) as statements
  from lesson_seed
  group by course_id
),
global_pool as (
  select array_agg(primary_statement order by id) as statements
  from (
    select id,primary_statement
    from lesson_seed
    where primary_statement is not null
    order by id
    limit 40
  ) p
),
prepared as (
  select
    s.*,
    case when cardinality(s.own_statements)>0 then s.own_statements else array[s.primary_statement] end as answers,
    array_cat(
      coalesce(array_remove(cp.statements,s.primary_statement),array[]::text[]),
      coalesce(array_remove(gp.statements,s.primary_statement),array[]::text[])
    ) as distractor_pool
  from lesson_seed s
  left join course_pool cp on cp.course_id=s.course_id
  cross join global_pool gp
),
question_rows as (
  select
    p.id as lesson_id,
    p.title,
    p.written_content,
    p.teaching_version,
    g.qn,
    left(p.answers[((g.qn-1) % greatest(cardinality(p.answers),1))+1],520) as correct_statement,
    array[
      left(p.distractor_pool[1],520),
      left(p.distractor_pool[2],520),
      left(p.distractor_pool[3],520)
    ] as distractors
  from prepared p
  cross join generate_series(1,5) g(qn)
  where cardinality(p.distractor_pool) >= 3
),
items as (
  select
    lesson_id,title,written_content,teaching_version,qn,
    jsonb_build_object(
      'questionText',
        case qn
          when 1 then 'Which statement is taught in "' || left(title,180) || '"?'
          when 2 then 'Which idea correctly belongs to the lesson "' || left(title,180) || '"?'
          when 3 then 'Choose the statement that matches the lesson "' || left(title,180) || '".'
          when 4 then 'Which point should a learner retain from "' || left(title,180) || '"?'
          else 'Which statement accurately reflects "' || left(title,180) || '"?'
        end,
      'questionType','multiple-choice',
      'options',
        case ((qn-1) % 4)
          when 0 then jsonb_build_array(correct_statement,distractors[1],distractors[2],distractors[3])
          when 1 then jsonb_build_array(distractors[1],correct_statement,distractors[2],distractors[3])
          when 2 then jsonb_build_array(distractors[1],distractors[2],correct_statement,distractors[3])
          else jsonb_build_array(distractors[1],distractors[2],distractors[3],correct_statement)
        end,
      'correctAnswer',correct_statement,
      'explanation','This statement comes directly from the lesson''s stored key points, objectives or description: "' || correct_statement || '"',
      'difficulty',case when qn<=2 then 'easy' when qn<=4 then 'medium' else 'hard' end
    ) as question
  from question_rows
  where correct_statement is not null
    and distractors[1] is not null
    and distractors[2] is not null
    and distractors[3] is not null
    and lower(correct_statement) <> lower(distractors[1])
    and lower(correct_statement) <> lower(distractors[2])
    and lower(correct_statement) <> lower(distractors[3])
    and lower(distractors[1]) <> lower(distractors[2])
    and lower(distractors[1]) <> lower(distractors[3])
    and lower(distractors[2]) <> lower(distractors[3])
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
select lesson_id,fingerprint,questions,'grounded-fallback',0,now()
from sets
on conflict (lesson_id) do update
set content_fingerprint=excluded.content_fingerprint,
    questions=excluded.questions,
    generation_method=excluded.generation_method,
    source_version=least(public.lesson_practice_sets.source_version,excluded.source_version),
    updated_at=now()
where public.lesson_practice_sets.generation_method <> 'ai';
