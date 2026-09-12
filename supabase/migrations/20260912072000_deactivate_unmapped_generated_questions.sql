-- Generated questions attached to legacy topics with no class or term are not
-- safe to serve as curriculum questions. Keep them for review but deactivate.
update public.questions q
set is_active = false,
    updated_at = now()
from public.topics t
where q.topic_id = t.id
  and q.class_id is null
  and t.class_id is null
  and t.term_id is null
  and q.source in ('NERDC_GENERATED','SYLLABUS_GENERATED')
  and q.is_active is distinct from false;
