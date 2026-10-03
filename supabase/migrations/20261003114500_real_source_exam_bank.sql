-- Promote only scoreable questions extracted from real Supabase source papers
-- into the secure exam engine. Keep provenance explicit and do not invent years.
insert into public.questions (
  id,
  subject_id,
  topic_id,
  question_type,
  question_text,
  question_image_url,
  options,
  correct_answer,
  explanation,
  difficulty,
  marks,
  source,
  exam_year,
  exam_name,
  tags,
  is_active,
  usage_count,
  created_at,
  updated_at
)
select
  pq.id,
  pq.subject_id,
  pq.topic_id,
  case when pq.question_type in ('mcq','multiple_choice') then 'mcq' else pq.question_type end,
  pq.question_text,
  pq.question_image_url,
  pq.options,
  pq.correct_answer,
  pq.explanation,
  coalesce(nullif(pq.difficulty,''),'medium'),
  coalesce(pq.marks,1),
  'SOURCE_PAPER:' || upper(pq.board),
  pq.year,
  upper(pq.board),
  coalesce(pq.tags,'[]'::jsonb) || jsonb_build_array('source-paper','supabase-storage'),
  true,
  coalesce(pq.usage_count,0),
  coalesce(pq.created_at,now()),
  now()
from public.past_questions pq
where pq.is_active = true
  and pq.source like 'storage:%'
  and lower(pq.board) in ('jamb','waec','neco','nabteb')
  and pq.subject_id is not null
  and pq.correct_answer is not null
  and jsonb_typeof(pq.options) = 'array'
  and jsonb_array_length(pq.options) >= 2
  and exists (
    select 1
    from jsonb_array_elements(pq.options) opt
    where lower(coalesce(opt->>'id', opt->>'value', opt->>'label', opt#>>'{}'))
          = lower(pq.correct_answer#>>'{}')
       or lower(coalesce(opt->>'text', opt->>'value', opt->>'label', opt#>>'{}'))
          = lower(pq.correct_answer#>>'{}')
  )
on conflict (id) do update
set
  subject_id = excluded.subject_id,
  topic_id = excluded.topic_id,
  question_type = excluded.question_type,
  question_text = excluded.question_text,
  question_image_url = excluded.question_image_url,
  options = excluded.options,
  correct_answer = excluded.correct_answer,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  marks = excluded.marks,
  source = excluded.source,
  exam_year = excluded.exam_year,
  exam_name = excluded.exam_name,
  tags = excluded.tags,
  is_active = true,
  updated_at = now();

-- Replace the legacy generated links for the two JAMB subjects that currently
-- have enough scoreable real source-paper questions for a full 40-question CBT.
delete from public.exam_questions eq
using public.exams e
where eq.exam_id = e.id
  and e.title in ('JAMB Economics CBT','JAMB English CBT');

with targets as (
  select id, subject_id
  from public.exams
  where title in ('JAMB Economics CBT','JAMB English CBT')
),
ranked as (
  select
    t.id as exam_id,
    q.id as question_id,
    row_number() over (partition by t.id order by md5(q.id::text)) as rn
  from targets t
  join public.questions q
    on q.subject_id = t.subject_id
   and q.source = 'SOURCE_PAPER:JAMB'
   and q.is_active = true
   and q.correct_answer is not null
   and jsonb_typeof(q.options) = 'array'
   and jsonb_array_length(q.options) >= 2
)
insert into public.exam_questions (exam_id,question_id,order_index,marks,section_name)
select exam_id,question_id,rn,1,'Source-paper CBT'
from ranked
where rn <= 40;

update public.exams e
set
  total_marks = 40,
  passing_marks = 20,
  is_active = true,
  is_public = true,
  updated_at = now()
where e.title in ('JAMB Economics CBT','JAMB English CBT')
  and (
    select count(*)
    from public.exam_questions eq
    join public.questions q on q.id=eq.question_id
    where eq.exam_id=e.id
      and q.is_active=true
      and q.source='SOURCE_PAPER:JAMB'
  ) >= 40;

-- Do not show a structured exam if it cannot serve at least five verified,
-- active questions. The separate Past Questions CBT remains available for
-- source material that has not yet yielded a reliable answer key.
update public.exams e
set is_active = false,
    is_public = false,
    updated_at = now()
where e.is_active = true
  and not exists (
    select 1
    from public.exam_questions eq
    join public.questions q on q.id=eq.question_id
    where eq.exam_id=e.id
      and q.is_active=true
      and (
        q.source ~* '^(WAEC|JAMB|NECO|NABTEB) [0-9]{4}$'
        or q.source ~* '^SOURCE_PAPER:(WAEC|JAMB|NECO|NABTEB)$'
      )
    group by eq.exam_id
    having count(*) >= 5
  );
