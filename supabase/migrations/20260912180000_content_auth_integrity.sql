-- Keep production content/auth integrity enforceable from schema migrations.

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
  if coalesce(new.is_published, false) is not true then
    return new;
  end if;

  if coalesce(new.content_quality, '') = 'needs_review' then
    raise exception 'Lesson marked needs_review cannot be published';
  end if;

  if length(trim(coalesce(new.title, ''))) = 0 then
    raise exception 'Published lesson requires a title';
  end if;

  if length(trim(coalesce(new.written_content, ''))) < 700 then
    raise exception 'Published lesson requires at least 700 characters of written content';
  end if;

  if jsonb_typeof(coalesce(new.learning_objectives, '[]'::jsonb)) = 'array' then
    objective_count := jsonb_array_length(coalesce(new.learning_objectives, '[]'::jsonb));
  end if;
  if objective_count < 2 then
    raise exception 'Published lesson requires at least two learning objectives';
  end if;

  if jsonb_typeof(coalesce(new.key_points, '[]'::jsonb)) = 'array' then
    key_point_count := jsonb_array_length(coalesce(new.key_points, '[]'::jsonb));
  end if;
  if key_point_count < 2 then
    raise exception 'Published lesson requires at least two key points';
  end if;

  combined_text := lower(concat_ws(' ', new.title, new.description, new.written_content));
  if combined_text ~ 'this objective means that you should be able to identify the relevant concept'
     or combined_text ~ 'this lesson covers .* a fundamental concept'
     or combined_text ~ 'apply the relevant formula for'
     or combined_text ~ 'a simple sentence demonstrating'
     or combined_text ~ 'is a mathematical concept taught in the nigerian'
  then
    raise exception 'Template/generic lesson content cannot be published';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_lesson_publication_quality on public.lessons;
create trigger trg_enforce_lesson_publication_quality
before insert or update of is_published, content_quality, title, written_content, learning_objectives, key_points, description
on public.lessons
for each row execute function public.enforce_lesson_publication_quality();

create or replace function public.enforce_active_question_quality()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  answer_id text;
  has_answer boolean := false;
begin
  if coalesce(new.is_active, false) is not true then
    return new;
  end if;

  if new.topic_id is null then
    raise exception 'Active curriculum questions must be linked to a topic';
  end if;

  if length(trim(coalesce(new.question_text, ''))) < 8 then
    raise exception 'Active question text is too short';
  end if;

  if new.question_type = 'mcq' then
    if jsonb_typeof(coalesce(new.options, '[]'::jsonb)) <> 'array'
       or jsonb_array_length(coalesce(new.options, '[]'::jsonb)) < 2 then
      raise exception 'Active MCQ requires at least two options';
    end if;

    answer_id := new.correct_answer #>> '{}';
    if answer_id is null or length(trim(answer_id)) = 0 then
      raise exception 'Active MCQ requires a correct answer';
    end if;

    select exists(
      select 1
      from jsonb_array_elements(new.options) option_row
      where option_row->>'id' = answer_id
    ) into has_answer;

    if not has_answer then
      raise exception 'Active MCQ correct answer must reference one of its option IDs';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_active_question_quality on public.questions;
create trigger trg_enforce_active_question_quality
before insert or update of is_active, topic_id, question_type, question_text, options, correct_answer
on public.questions
for each row execute function public.enforce_active_question_quality();

-- Backfill historic Supabase Auth accounts that predate the profile/role triggers.
insert into public.profiles (id,email,first_name,last_name,middle_name,is_active,created_at,updated_at)
select u.id,u.email,
       coalesce(u.raw_user_meta_data->>'first_name',''),
       coalesce(u.raw_user_meta_data->>'last_name',''),
       nullif(u.raw_user_meta_data->>'middle_name',''),
       true,coalesce(u.created_at,now()),now()
from auth.users u
left join public.profiles p on p.id=u.id
where p.id is null
on conflict (id) do nothing;

insert into public.user_roles (user_id,role_id)
select u.id, r.id
from auth.users u
join public.roles r
  on r.name = case
    when lower(coalesce(u.raw_user_meta_data->>'role','student')) in ('student','teacher','parent')
      then lower(coalesce(u.raw_user_meta_data->>'role','student'))
    else 'student'
  end
left join public.user_roles ur on ur.user_id=u.id
where ur.user_id is null
on conflict do nothing;

-- These rows duplicate records in past_questions and have no curriculum topic mapping.
-- Keep the dedicated past-question copies active; do not surface the duplicates as curriculum questions.
update public.questions q
set is_active = false, updated_at = now()
where q.is_active = true
  and q.topic_id is null
  and exists (
    select 1
    from public.past_questions p
    where p.is_active = true
      and lower(trim(p.question_text)) = lower(trim(q.question_text))
  );
