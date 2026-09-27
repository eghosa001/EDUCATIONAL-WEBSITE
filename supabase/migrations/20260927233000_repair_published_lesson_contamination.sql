-- Production lesson cleanup: preserve a private rollback copy, reuse clean parallel
-- curriculum lessons when possible, quarantine unresolved contamination, and block recurrence.

create table if not exists public.lesson_content_repair_backup_20260927 (
  id uuid primary key,
  written_content text,
  content_quality text,
  is_published boolean,
  teaching_version integer,
  updated_at timestamptz,
  backed_up_at timestamptz not null default now()
);
alter table public.lesson_content_repair_backup_20260927 enable row level security;
revoke all on table public.lesson_content_repair_backup_20260927 from anon, authenticated;

insert into public.lesson_content_repair_backup_20260927
  (id,written_content,content_quality,is_published,teaching_version,updated_at)
select id,written_content,content_quality,is_published,teaching_version,updated_at
from public.lessons
where is_published = true and written_content ~ '[一-龯]'
on conflict (id) do nothing;

with clean_candidates as (
  select bad.id as bad_id, clean.written_content as clean_content,
         row_number() over (partition by bad.id order by length(clean.written_content) desc, clean.updated_at desc, clean.id) rn
  from public.lessons bad
  join public.courses bad_course on bad_course.id = bad.course_id
  join public.lessons clean
    on clean.id <> bad.id
   and clean.is_published = true
   and clean.content_quality is distinct from 'needs_review'
   and clean.written_content !~ '[一-龯]'
   and lower(trim(clean.title)) = lower(trim(bad.title))
   and lower(concat_ws(' ',clean.title,clean.description,clean.written_content)) !~
     '(this objective means that you should be able to identify the relevant concept|this lesson covers .* a fundamental concept|apply the relevant formula for|a simple sentence demonstrating|is a mathematical concept taught in the nigerian)'
  join public.courses clean_course
    on clean_course.id = clean.course_id
   and clean_course.subject_id = bad_course.subject_id
   and clean_course.term_id = bad_course.term_id
  where bad.is_published = true and bad.written_content ~ '[一-龯]'
)
update public.lessons l
set written_content = c.clean_content,
    content_quality = 'ai_reviewed',
    teaching_version = coalesce(l.teaching_version,0) + 1,
    updated_at = now()
from clean_candidates c
where l.id = c.bad_id and c.rn = 1;

update public.lessons
set content_quality = 'needs_review', is_published = false, updated_at = now()
where is_published = true
  and concat_ws(' ',title,description,written_content) ~ '[一-龯]';

create or replace function public.enforce_lesson_publication_quality()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  objective_count integer := 0;
  key_point_count integer := 0;
  combined_text text;
begin
  if coalesce(new.is_published, false) is not true then return new; end if;
  if coalesce(new.content_quality, '') = 'needs_review' then raise exception 'Lesson marked needs_review cannot be published'; end if;
  if length(trim(coalesce(new.title, ''))) = 0 then raise exception 'Published lesson requires a title'; end if;
  if length(trim(coalesce(new.written_content, ''))) < 700 then raise exception 'Published lesson requires at least 700 characters of written content'; end if;
  if jsonb_typeof(coalesce(new.learning_objectives, '[]'::jsonb)) = 'array' then objective_count := jsonb_array_length(coalesce(new.learning_objectives, '[]'::jsonb)); end if;
  if objective_count < 2 then raise exception 'Published lesson requires at least two learning objectives'; end if;
  if jsonb_typeof(coalesce(new.key_points, '[]'::jsonb)) = 'array' then key_point_count := jsonb_array_length(coalesce(new.key_points, '[]'::jsonb)); end if;
  if key_point_count < 2 then raise exception 'Published lesson requires at least two key points'; end if;
  combined_text := lower(concat_ws(' ', new.title, new.description, new.written_content));
  if combined_text ~ '[一-龯]' then raise exception 'Published lesson contains unsupported CJK contamination'; end if;
  if combined_text ~ 'this objective means that you should be able to identify the relevant concept'
     or combined_text ~ 'this lesson covers .* a fundamental concept'
     or combined_text ~ 'apply the relevant formula for'
     or combined_text ~ 'a simple sentence demonstrating'
     or combined_text ~ 'is a mathematical concept taught in the nigerian'
  then raise exception 'Template/generic lesson content cannot be published'; end if;
  return new;
end;
$$;
