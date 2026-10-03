-- Recover previously quarantined lessons only when a clean same-title/same-subject/same-term
-- published counterpart now exists. Preserve rollback state and restore the standard visual summary.

create table if not exists public.lesson_content_repair_backup_20261003 (
  id uuid primary key,
  description text,
  learning_objectives jsonb,
  written_content text,
  key_points jsonb,
  estimated_minutes integer,
  content_quality text,
  is_published boolean,
  teaching_version integer,
  updated_at timestamptz,
  backed_up_at timestamptz not null default now()
);
alter table public.lesson_content_repair_backup_20261003 enable row level security;
revoke all on table public.lesson_content_repair_backup_20261003 from anon,authenticated;

with candidates as (
  select bad.id as bad_id,clean.id as clean_id,
         clean.description,clean.learning_objectives,clean.written_content,clean.key_points,clean.estimated_minutes,
         row_number() over(partition by bad.id order by length(clean.written_content) desc,clean.updated_at desc,clean.id) rn
  from public.lessons bad
  join public.courses bc on bc.id=bad.course_id
  join public.lessons clean on clean.id<>bad.id
    and clean.is_published=true
    and clean.content_quality is distinct from 'needs_review'
    and clean.written_content !~ '[一-龯]'
    and lower(trim(clean.title))=lower(trim(bad.title))
  join public.courses cc on cc.id=clean.course_id
   and cc.subject_id=bc.subject_id
   and cc.term_id=bc.term_id
  where bad.content_quality='needs_review' and bad.is_published=false
),
ready as (
  select c.*
  from candidates c
  join public.lessons bad on bad.id=c.bad_id
  where c.rn=1
    and length(trim(coalesce(c.written_content,'')))>=700
    and jsonb_typeof(coalesce(c.learning_objectives,'[]'::jsonb))='array'
    and jsonb_array_length(coalesce(c.learning_objectives,'[]'::jsonb))>=2
    and jsonb_typeof(coalesce(c.key_points,'[]'::jsonb))='array'
    and jsonb_array_length(coalesce(c.key_points,'[]'::jsonb))>=2
    and lower(concat_ws(' ',bad.title,c.description,c.written_content)) !~ '[一-龯]'
    and lower(concat_ws(' ',bad.title,c.description,c.written_content)) !~
      '(this objective means that you should be able to identify the relevant concept|this lesson covers .* a fundamental concept|apply the relevant formula for|a simple sentence demonstrating|is a mathematical concept taught in the nigerian)'
)
insert into public.lesson_content_repair_backup_20261003
(id,description,learning_objectives,written_content,key_points,estimated_minutes,content_quality,is_published,teaching_version,updated_at)
select l.id,l.description,l.learning_objectives,l.written_content,l.key_points,l.estimated_minutes,l.content_quality,l.is_published,l.teaching_version,l.updated_at
from public.lessons l join ready r on r.bad_id=l.id
on conflict(id) do nothing;

with candidates as (
  select bad.id as bad_id,
         clean.description,clean.learning_objectives,clean.written_content,clean.key_points,clean.estimated_minutes,
         row_number() over(partition by bad.id order by length(clean.written_content) desc,clean.updated_at desc,clean.id) rn
  from public.lessons bad
  join public.courses bc on bc.id=bad.course_id
  join public.lessons clean on clean.id<>bad.id
    and clean.is_published=true
    and clean.content_quality is distinct from 'needs_review'
    and clean.written_content !~ '[一-龯]'
    and lower(trim(clean.title))=lower(trim(bad.title))
  join public.courses cc on cc.id=clean.course_id
   and cc.subject_id=bc.subject_id
   and cc.term_id=bc.term_id
  where bad.content_quality='needs_review' and bad.is_published=false
),
ready as (
  select c.*
  from candidates c
  join public.lessons bad on bad.id=c.bad_id
  where c.rn=1
    and length(trim(coalesce(c.written_content,'')))>=700
    and jsonb_typeof(coalesce(c.learning_objectives,'[]'::jsonb))='array'
    and jsonb_array_length(coalesce(c.learning_objectives,'[]'::jsonb))>=2
    and jsonb_typeof(coalesce(c.key_points,'[]'::jsonb))='array'
    and jsonb_array_length(coalesce(c.key_points,'[]'::jsonb))>=2
    and lower(concat_ws(' ',bad.title,c.description,c.written_content)) !~ '[一-龯]'
    and lower(concat_ws(' ',bad.title,c.description,c.written_content)) !~
      '(this objective means that you should be able to identify the relevant concept|this lesson covers .* a fundamental concept|apply the relevant formula for|a simple sentence demonstrating|is a mathematical concept taught in the nigerian)'
)
update public.lessons l
set description=r.description,
    learning_objectives=r.learning_objectives,
    written_content=r.written_content,
    key_points=r.key_points,
    estimated_minutes=r.estimated_minutes,
    content_quality='ai_reviewed',
    is_published=true,
    teaching_version=coalesce(l.teaching_version,0)+1,
    updated_at=now()
from ready r where l.id=r.bad_id;

insert into public.lesson_resources
(lesson_id,title,resource_type,file_url,mime_type,description,is_downloadable,order_index)
select l.id,'Lesson visual summary','visual-summary','/lesson-visuals/'||l.id::text,'image/svg+xml',
       'Concept-map image generated directly from this lesson''s objectives and key points.',true,0
from public.lessons l
where l.is_published=true
  and l.content_quality='ai_reviewed'
  and exists(select 1 from public.lesson_content_repair_backup_20261003 b where b.id=l.id)
  and not exists(select 1 from public.lesson_resources r where r.lesson_id=l.id and r.resource_type='visual-summary');
