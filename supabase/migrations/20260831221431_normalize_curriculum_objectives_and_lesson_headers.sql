-- Normalize double-encoded NERDC objectives that were stored as JSON strings.
update public.topics
set learning_objectives = (learning_objectives #>> '{}')::jsonb
where jsonb_typeof(learning_objectives) = 'string'
  and (learning_objectives #>> '{}') ~ '^\s*\[';

update public.lessons
set learning_objectives = (learning_objectives #>> '{}')::jsonb
where jsonb_typeof(learning_objectives) = 'string'
  and (learning_objectives #>> '{}') ~ '^\s*\[';

with canonical as (
  select l.id,
         regexp_replace(cl.name, '\\s+Class\\s+[A-Za-z]+$', '') || ' ' || s.name || ': ' || t.name as title
  from public.lessons l
  join public.courses c on c.id = l.course_id
  join public.classes cl on cl.id = c.class_id
  join public.subjects s on s.id = c.subject_id
  join public.topics t on t.id = l.topic_id
)
update public.lessons l
set title = canonical.title,
    written_content = case
      when l.written_content is null or btrim(l.written_content) = '' then l.written_content
      else regexp_replace(l.written_content, '^\\s*#\\s*[^\\n]+', '# ' || canonical.title, 1, 1, 'm')
    end,
    updated_at = now()
from canonical
where l.id = canonical.id;

alter table public.lesson_content_backup_20260831 enable row level security;
revoke all on table public.lesson_content_backup_20260831 from anon, authenticated;
revoke execute on function public.has_role(text) from authenticated;
revoke execute on function public.has_role(text) from anon;
