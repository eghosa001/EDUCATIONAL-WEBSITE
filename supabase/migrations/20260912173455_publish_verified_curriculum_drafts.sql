-- Publish one structurally complete reviewed draft for every mapped topic that still lacks a published lesson.
-- Publication remains guarded by enforce_lesson_publication_quality().

with ranked as (
  select l.id,l.topic_id,
         row_number() over (
           partition by l.topic_id
           order by length(coalesce(l.written_content,'')) desc,
                    l.updated_at desc nulls last,
                    l.id
         ) as rn
  from public.lessons l
  join public.topics t on t.id=l.topic_id
  where t.is_active is true
    and t.class_id is not null
    and t.term_id is not null
    and not l.is_published
    and not exists (
      select 1 from public.lessons p
      where p.topic_id=t.id and p.is_published
    )
    and length(coalesce(l.written_content,'')) >= 700
    and jsonb_typeof(l.learning_objectives)='array'
    and jsonb_array_length(l.learning_objectives)>=2
    and jsonb_typeof(l.key_points)='array'
    and jsonb_array_length(l.key_points)>=2
    and lower(concat_ws(' ',l.title,l.description,l.written_content)) !~
      'this objective means that you should be able to identify the relevant concept|this lesson covers .* a fundamental concept|apply the relevant formula for|a simple sentence demonstrating|is a mathematical concept taught in the nigerian'
)
update public.lessons l
set is_published=true,
    content_quality='ai_reviewed',
    updated_at=now()
from ranked r
where l.id=r.id and r.rn=1;
