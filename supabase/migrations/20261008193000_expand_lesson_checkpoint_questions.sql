-- Expands learner-facing lesson practice coverage without mislabeling anything as a historical past paper.
-- Each published lesson whose topic has no active question receives one lesson-grounded checkpoint MCQ.
-- The correct answer is stored server-side; frontend lesson queries do not select correct_answer.

insert into public.questions (
  id,
  subject_id,
  topic_id,
  class_id,
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
  usage_count,
  created_at,
  updated_at
)
with candidates as (
  select
    l.id as lesson_id,
    l.title as lesson_title,
    l.topic_id,
    l.course_id,
    c.title as course_title,
    c.subject_id,
    c.class_id
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where l.is_published = true
    and c.status = 'published'
    and l.topic_id is not null
    and coalesce(nullif(trim(l.title), ''), '') <> ''
    and not exists (
      select 1
      from public.questions q
      where q.topic_id = l.topic_id
        and q.is_active = true
    )
    and not exists (
      select 1
      from public.questions q
      where q.source = 'THE GUIDE Lesson Checkpoint'
        and q.question_text = 'Which checkpoint best matches the lesson "' || l.title || '"?'
    )
), with_distractors as (
  select
    c.*,
    coalesce(d.wrong_titles, array[]::text[]) as wrong_titles
  from candidates c
  left join lateral (
    select array_agg(title order by sort_key) as wrong_titles
    from (
      select
        left(o.title, 110) as title,
        min(md5(o.id::text || c.lesson_id::text)) as sort_key
      from public.lessons o
      join public.courses oc on oc.id = o.course_id
      where o.is_published = true
        and o.id <> c.lesson_id
        and oc.subject_id = c.subject_id
        and coalesce(nullif(trim(o.title), ''), '') <> ''
      group by left(o.title, 110)
      order by min(md5(o.id::text || c.lesson_id::text))
      limit 3
    ) ranked
  ) d on true
)
select
  gen_random_uuid(),
  subject_id,
  topic_id,
  class_id,
  'mcq',
  'Which checkpoint best matches the lesson "' || lesson_title || '"?',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Understand ' || left(lesson_title, 110)),
    jsonb_build_object('id', 'B', 'text', 'Understand ' || coalesce(wrong_titles[1], 'a different lesson in this subject')),
    jsonb_build_object('id', 'C', 'text', 'Understand ' || coalesce(wrong_titles[2], 'a separate topic objective')),
    jsonb_build_object('id', 'D', 'text', 'Understand ' || coalesce(wrong_titles[3], 'an unrelated class activity'))
  ),
  to_jsonb('A'::text),
  'This checkpoint is tied to the published lesson "' || lesson_title || '" in ' || coalesce(course_title, 'this course') || '. Review the lesson notes, objectives and key points before answering.',
  'easy',
  1,
  'THE GUIDE Lesson Checkpoint',
  'Lesson Checkpoint Practice',
  jsonb_build_array('lesson-checkpoint', 'curriculum-practice', 'lesson:' || lesson_id::text, 'course:' || course_id::text),
  true,
  0,
  now(),
  now()
from with_distractors;
