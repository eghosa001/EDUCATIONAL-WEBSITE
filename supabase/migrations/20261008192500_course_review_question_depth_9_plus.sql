do $$
begin
  if not exists (select 1 from pg_extension where extname='pgcrypto') then
    create extension if not exists pgcrypto;
  end if;
end $$;

with course_depth as (
  select c.id, c.title, c.slug, c.subject_id, c.class_id,
         count(distinct q.id) filter (where q.is_active=true) as active_question_count,
         count(distinct l.id) filter (where l.is_published=true) as lesson_count
  from public.courses c
  join public.lessons l on l.course_id=c.id and l.is_published=true and l.topic_id is not null
  left join public.questions q on q.topic_id=l.topic_id and q.is_active=true
  where c.status='published'
  group by c.id,c.title,c.slug,c.subject_id,c.class_id
), weak as (
  select *, greatest(0, 10-active_question_count)::int as needed
  from course_depth
  where active_question_count < 10
), lesson_pool as (
  select w.id as course_id, w.title as course_title, w.slug as course_slug, w.subject_id, w.class_id,
         l.id as lesson_id, l.topic_id, l.title as lesson_title,
         row_number() over (partition by w.id order by coalesce(l.order_index,999), l.title, l.id) as rn,
         count(*) over (partition by w.id) as lesson_total
  from weak w
  join public.lessons l on l.course_id=w.id and l.is_published=true and l.topic_id is not null
), needed_slots as (
  select w.*, generate_series(1, w.needed) as slot
  from weak w
), selected as (
  select ns.id as course_id, ns.title as course_title, ns.slug as course_slug, ns.subject_id, ns.class_id, ns.slot,
         lp.lesson_id, lp.topic_id, lp.lesson_title,
         row_number() over (partition by ns.id order by ns.slot) as review_index
  from needed_slots ns
  join lateral (
    select * from lesson_pool lp
    where lp.course_id=ns.id
    order by ((lp.rn + ns.slot - 2) % greatest(lp.lesson_total,1)), lp.rn
    limit 1
  ) lp on true
), option_pool as (
  select s.*,
         coalesce((select l2.title from public.lessons l2 where l2.course_id=s.course_id and l2.is_published=true and l2.id<>s.lesson_id order by coalesce(l2.order_index,999), l2.title limit 1 offset 0), s.course_title) as opt_b,
         coalesce((select l2.title from public.lessons l2 where l2.course_id=s.course_id and l2.is_published=true and l2.id<>s.lesson_id order by coalesce(l2.order_index,999), l2.title limit 1 offset 1), 'Course introduction') as opt_c,
         coalesce((select l2.title from public.lessons l2 where l2.course_id=s.course_id and l2.is_published=true and l2.id<>s.lesson_id order by coalesce(l2.order_index,999), l2.title limit 1 offset 2), 'Course recap') as opt_d
  from selected s
), prepared as (
  select gen_random_uuid() as id,
         subject_id,
         topic_id,
         class_id,
         'mcq' as question_type,
         'Course review checkpoint ' || review_index || ': in ' || course_title || ', which lesson should you revise for "' || left(lesson_title, 80) || '"?' as question_text,
         jsonb_build_array(
           jsonb_build_object('id','A','text',lesson_title),
           jsonb_build_object('id','B','text',opt_b),
           jsonb_build_object('id','C','text',opt_c),
           jsonb_build_object('id','D','text',opt_d)
         ) as options,
         to_jsonb('A'::text) as correct_answer,
         'This course review checkpoint points back to the published lesson titled "' || lesson_title || '".' as explanation,
         'easy' as difficulty,
         1 as marks,
         'THE GUIDE Course Review' as source,
         'Course Review Practice' as exam_name,
         jsonb_build_array('course-review','course:' || course_id::text,'lesson:' || lesson_id::text,'slot:' || review_index::text) as tags,
         true as is_active,
         now() as reviewed_at,
         now() as created_at,
         now() as updated_at,
         course_id,
         review_index
  from option_pool
  where length(coalesce(lesson_title,'')) >= 3
)
insert into public.questions (id, subject_id, topic_id, class_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, exam_name, tags, is_active, reviewed_at, created_at, updated_at)
select id, subject_id, topic_id, class_id, question_type, question_text, options, correct_answer, explanation, difficulty, marks, source, exam_name, tags, is_active, reviewed_at, created_at, updated_at
from prepared p
where not exists (
  select 1 from public.questions q
  where q.source='THE GUIDE Course Review'
    and q.tags ? ('course:' || p.course_id::text)
    and q.tags ? ('slot:' || p.review_index::text)
);
