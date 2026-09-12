begin;
create temporary table _duplicate_lessons on commit drop as
with ranked as (
  select id,
         first_value(id) over (partition by course_id,topic_id,title,written_content order by created_at,id) canonical_id,
         row_number() over (partition by course_id,topic_id,title,written_content order by created_at,id) rn
  from public.lessons
)
select id duplicate_id,canonical_id from ranked where rn>1;

delete from public.lesson_quality_audits x using _duplicate_lessons d where x.lesson_id=d.duplicate_id;
delete from public.lesson_upgrade_queue x using _duplicate_lessons d where x.lesson_id=d.duplicate_id;
delete from public.lessons l using _duplicate_lessons d where l.id=d.duplicate_id;
commit;
