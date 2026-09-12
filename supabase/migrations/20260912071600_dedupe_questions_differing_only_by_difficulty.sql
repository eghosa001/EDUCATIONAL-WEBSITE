begin;

create temporary table _question_dedup on commit drop as
with base as (
  select q.*,
         md5(concat_ws('|',
           coalesce(subject_id::text,''),coalesce(topic_id::text,''),coalesce(subtopic_id::text,''),coalesce(class_id::text,''),
           coalesce(question_type,''),coalesce(question_text,''),coalesce(question_image_url,''),coalesce(options::text,''),
           coalesce(correct_answer::text,''),coalesce(explanation,''),coalesce(explanation_image_url,''),
           coalesce(marks::text,''),coalesce(negative_marks::text,''),coalesce(time_limit_seconds::text,''),coalesce(source,''),
           coalesce(exam_year::text,''),coalesce(exam_name,''),coalesce(tags::text,''),coalesce(is_active::text,''),
           coalesce(usage_count::text,''),coalesce(created_by::text,''),coalesce(reviewed_by::text,''),coalesce(reviewed_at::text,'')
         )) grp
  from public.questions q
), eligible as (
  select grp from base group by grp having count(*)>1 and count(distinct difficulty)>1
), ranked as (
  select b.id,
         first_value(b.id) over (partition by b.grp order by case when b.difficulty='medium' then 0 when b.difficulty='easy' then 1 else 2 end, b.created_at, b.id) canonical_id,
         row_number() over (partition by b.grp order by case when b.difficulty='medium' then 0 when b.difficulty='easy' then 1 else 2 end, b.created_at, b.id) rn
  from base b join eligible e using (grp)
)
select id duplicate_id, canonical_id from ranked where rn>1;

delete from public.quiz_questions q
using _question_dedup d
where q.question_id=d.duplicate_id
  and exists (select 1 from public.quiz_questions c where c.quiz_id=q.quiz_id and c.question_id=d.canonical_id);
update public.quiz_questions q set question_id=d.canonical_id from _question_dedup d where q.question_id=d.duplicate_id;

delete from public.exam_questions q
using _question_dedup d
where q.question_id=d.duplicate_id
  and exists (select 1 from public.exam_questions c where c.exam_id=q.exam_id and c.question_id=d.canonical_id);
update public.exam_questions q set question_id=d.canonical_id from _question_dedup d where q.question_id=d.duplicate_id;
update public.exam_answers a set question_id=d.canonical_id from _question_dedup d where a.question_id=d.duplicate_id;
delete from public.questions q using _question_dedup d where q.id=d.duplicate_id;

commit;
