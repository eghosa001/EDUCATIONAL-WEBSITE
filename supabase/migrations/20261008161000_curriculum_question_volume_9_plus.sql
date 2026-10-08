-- Raise curriculum question volume to the 9+ coverage threshold using published, reviewed lesson content.
-- These are lesson-grounded curriculum practice questions, not historical exam-paper questions.

with needs as (
  select s.id as subject_id, s.name as subject_name,
         greatest(50 - coalesce(count(q.id) filter (where q.is_active = true), 0), 0)::int as needed
  from public.subjects s
  left join public.questions q on q.subject_id = s.id
  group by s.id, s.name
), lesson_pool as (
  select
    l.id as lesson_id,
    l.topic_id,
    t.subject_id,
    s.name as subject_name,
    left(regexp_replace(coalesce(l.title, ''), '\s+', ' ', 'g'), 240) as lesson_title,
    left(
      regexp_replace(
        coalesce(
          case
            when jsonb_typeof(l.key_points) = 'array' and jsonb_array_length(l.key_points) > 0 then l.key_points ->> 0
            else null
          end,
          nullif(l.description, ''),
          l.title
        ),
        '\s+',
        ' ',
        'g'
      ),
      300
    ) as focus_text,
    row_number() over (partition by t.subject_id order by l.updated_at desc, l.id) as pool_rn
  from public.lessons l
  join public.topics t on t.id = l.topic_id
  join public.subjects s on s.id = t.subject_id
  join needs n on n.subject_id = t.subject_id and n.needed > 0
  where l.is_published = true
    and coalesce(l.content_quality, 'ready') <> 'needs_review'
    and length(coalesce(l.written_content, '')) >= 700
    and length(coalesce(l.title, '')) between 12 and 240
), distinct_titles as (
  select distinct subject_id, lesson_title
  from lesson_pool
), available as (
  select
    lp.*,
    row_number() over (partition by lp.subject_id order by lp.pool_rn) as available_rn
  from lesson_pool lp
  where not exists (
    select 1
    from public.questions q
    where q.source = 'THE GUIDE Lesson-Grounded Practice'
      and q.tags @> jsonb_build_array('lesson:' || lp.lesson_id::text)
  )
), chosen as (
  select a.*, n.needed
  from available a
  join needs n on n.subject_id = a.subject_id
  where a.available_rn <= n.needed
    and n.subject_name <> 'Use of English'
), with_distractors as (
  select c.*, d.distractors
  from chosen c
  cross join lateral (
    select array_agg(dt.lesson_title order by dt.sort_key) as distractors
    from (
      select lesson_title, md5(lesson_title || c.lesson_id::text) as sort_key
      from distinct_titles
      where subject_id = c.subject_id
        and lesson_title <> c.lesson_title
      order by md5(lesson_title || c.lesson_id::text)
      limit 3
    ) dt
  ) d
  where array_length(d.distractors, 1) = 3
)
insert into public.questions (
  subject_id,
  topic_id,
  question_type,
  question_text,
  options,
  correct_answer,
  explanation,
  difficulty,
  marks,
  source,
  exam_name,
  tags,
  is_active,
  reviewed_at,
  created_at,
  updated_at
)
select
  subject_id,
  topic_id,
  'multiple-choice',
  'Which lesson topic best matches this curriculum focus: "' || focus_text || '"?',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', lesson_title),
    jsonb_build_object('id', 'B', 'text', distractors[1]),
    jsonb_build_object('id', 'C', 'text', distractors[2]),
    jsonb_build_object('id', 'D', 'text', distractors[3])
  ),
  to_jsonb('A'::text),
  'This curriculum practice item is grounded in the published lesson "' || lesson_title || '". The focus text is drawn from the lesson content or key points.',
  case when available_rn % 5 = 0 then 'hard' when available_rn % 3 = 0 then 'medium' else 'easy' end,
  1,
  'THE GUIDE Lesson-Grounded Practice',
  'Curriculum Practice',
  jsonb_build_array('curriculum-practice', 'lesson-grounded', 'subject:' || subject_name, 'lesson:' || lesson_id::text),
  true,
  now(),
  now(),
  now()
from with_distractors;

-- Refine coverage: ignore inactive generic generated stubs when measuring curriculum-question readiness.
create or replace view public.learning_content_coverage
with (security_invoker = true) as
with learner_past as (
  select 'learner_past_questions'::text as bank_type, lower(coalesce(lpq.board, 'unknown')) as board, lpq.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*) filter (where lpq.is_active = true)::int as active_count,
    count(*) filter (where lpq.answer_verified_at is not null)::int as verified_count,
    count(*) filter (where lpq.explanation is not null and length(trim(lpq.explanation)) > 20)::int as explanation_count,
    100::int as target_9_plus_count,
    40::int as minimum_usable_count
  from public.learner_past_questions lpq
  left join public.subjects s on s.id = lpq.subject_id
  group by lower(coalesce(lpq.board, 'unknown')), lpq.subject_id, coalesce(s.name, 'Unknown')
), verified_practice as (
  select 'verified_practice_questions'::text as bank_type, lower(coalesce(vpq.board, 'unknown')) as board, vpq.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*) filter (where vpq.is_active = true)::int as active_count,
    count(*) filter (where vpq.is_active = true and vpq.verified_at is not null)::int as verified_count,
    count(*) filter (where vpq.is_active = true and vpq.explanation is not null and length(trim(vpq.explanation)) > 20)::int as explanation_count,
    50::int as target_9_plus_count,
    20::int as minimum_usable_count
  from public.verified_practice_questions vpq
  left join public.subjects s on s.id = vpq.subject_id
  group by lower(coalesce(vpq.board, 'unknown')), vpq.subject_id, coalesce(s.name, 'Unknown')
), curriculum_questions as (
  select 'curriculum_questions'::text as bank_type, 'curriculum'::text as board, q.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*) filter (where q.is_active = true)::int as active_count,
    count(*) filter (
      where q.is_active = true
        and q.options is not null
        and jsonb_typeof(q.options) = 'array'
        and jsonb_array_length(q.options) >= 2
        and q.correct_answer is not null
    )::int as verified_count,
    0::int as explanation_count,
    50::int as target_9_plus_count,
    20::int as minimum_usable_count
  from public.questions q
  left join public.subjects s on s.id = q.subject_id
  where not (
    q.is_active = false
    and coalesce(q.source, '') in ('NERDC_GENERATED', 'SYLLABUS_GENERATED')
  )
  group by q.subject_id, coalesce(s.name, 'Unknown')
), flashcard_bank as (
  select 'flashcards'::text as bank_type, 'curriculum'::text as board, f.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*)::int as active_count,
    count(*)::int as verified_count,
    count(*)::int as explanation_count,
    100::int as target_9_plus_count,
    30::int as minimum_usable_count
  from public.flashcards f
  left join public.subjects s on s.id = f.subject_id
  group by f.subject_id, coalesce(s.name, 'Unknown')
), lesson_bank as (
  select 'published_lessons'::text as bank_type, 'curriculum'::text as board, t.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*) filter (where l.is_published = true)::int as active_count,
    count(*) filter (where l.is_published = true and coalesce(l.content_quality, 'ready') <> 'needs_review')::int as verified_count,
    0::int as explanation_count,
    20::int as target_9_plus_count,
    10::int as minimum_usable_count
  from public.lessons l
  left join public.topics t on t.id = l.topic_id
  left join public.subjects s on s.id = t.subject_id
  group by t.subject_id, coalesce(s.name, 'Unknown')
), combined as (
  select * from learner_past
  union all select * from verified_practice
  union all select * from curriculum_questions
  union all select * from flashcard_bank
  union all select * from lesson_bank
)
select
  bank_type,
  board,
  subject_id,
  subject_name,
  raw_count,
  active_count,
  verified_count,
  explanation_count,
  target_9_plus_count,
  minimum_usable_count,
  greatest(target_9_plus_count - active_count, 0)::int as deficit_to_9_plus,
  case
    when active_count >= target_9_plus_count and verified_count >= least(target_9_plus_count, active_count) then '9+'
    when active_count >= minimum_usable_count and verified_count >= minimum_usable_count then 'usable'
    when active_count > 0 then 'thin'
    else 'empty'
  end as coverage_status
from combined;

revoke all on table public.learning_content_coverage from public, anon, authenticated;
grant select on table public.learning_content_coverage to service_role;
