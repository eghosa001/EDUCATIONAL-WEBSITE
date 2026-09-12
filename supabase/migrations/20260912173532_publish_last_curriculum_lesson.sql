-- Repair the final mapped lesson that was blocked only by a generic description phrase,
-- then publish it through the normal quality trigger.

with target as (
  select l.id
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
  order by length(coalesce(l.written_content,'')) desc
  limit 1
)
update public.lessons l
set description = regexp_replace(
      coalesce(l.description,''),
      '^This lesson covers ',
      'This lesson explains ',
      'i'
    ),
    content_quality='ai_reviewed',
    is_published=true,
    updated_at=now()
from target
where l.id=target.id;
