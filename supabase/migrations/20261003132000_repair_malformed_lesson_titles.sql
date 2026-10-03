-- Repair malformed published lesson titles only when the lesson body contains a
-- clearer class/subject heading. Keep slugs unchanged so existing links remain stable.
with candidates as (
  select
    l.id,
    l.title as old_title,
    trim(regexp_replace(
      (regexp_match(l.written_content,'(?m)^#{1,3}[[:space:]]+([^\n]+)'))[1],
      '^(Lesson Title:|Topic:)[[:space:]]*','','i'
    )) as body_heading
  from public.lessons l
  where l.is_published=true
    and (
      l.title like '%•%'
      or l.title ~* '(\bof|\band|\bthe|\bto|\bfor|\bin|\bwith|\bfrom|:)$'
      or length(trim(l.title))<25
    )
)
update public.lessons l
set
  title = regexp_replace(c.body_heading,'[[:space:]]*[•]+[[:space:]]*',' — ','g'),
  updated_at = now()
from candidates c
where l.id=c.id
  and c.body_heading is not null
  and length(c.body_heading) between 20 and 220
  and c.body_heading ~* '^(Primary|JSS|SSS|Junior|Senior)([[:space:]]|[0-9])'
  and c.body_heading <> c.old_title
  and c.body_heading !~* '(definition|introduction|summary|conclusion)$';
