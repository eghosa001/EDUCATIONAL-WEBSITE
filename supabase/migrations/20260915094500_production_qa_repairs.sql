-- Production QA repairs: bookmarks, CBT function ACLs, and populated exam visibility.

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookmarks_target_check check (course_id is not null or lesson_id is not null)
);

create index if not exists idx_bookmarks_user on public.bookmarks(user_id);
create index if not exists idx_bookmarks_course on public.bookmarks(course_id);
create index if not exists idx_bookmarks_lesson on public.bookmarks(lesson_id);
create unique index if not exists idx_bookmarks_user_course_unique
  on public.bookmarks(user_id, course_id) where course_id is not null;
create unique index if not exists idx_bookmarks_user_lesson_unique
  on public.bookmarks(user_id, lesson_id) where lesson_id is not null;

alter table public.bookmarks enable row level security;

drop policy if exists bookmarks_select_own on public.bookmarks;
create policy bookmarks_select_own on public.bookmarks
  for select to authenticated using (user_id = auth.uid());

drop policy if exists bookmarks_insert_own on public.bookmarks;
create policy bookmarks_insert_own on public.bookmarks
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists bookmarks_delete_own on public.bookmarks;
create policy bookmarks_delete_own on public.bookmarks
  for delete to authenticated using (user_id = auth.uid());

grant select, insert, delete on public.bookmarks to authenticated;

-- These functions validate auth.uid() internally, but anonymous callers should not
-- have EXECUTE at all. Keep the database ACL aligned with the intended contract.
revoke execute on function public.cbt_get_questions(uuid, uuid, integer) from anon;
revoke execute on function public.cbt_grade(jsonb) from anon;
grant execute on function public.cbt_get_questions(uuid, uuid, integer) to authenticated;
grant execute on function public.cbt_grade(jsonb) to authenticated;

-- Existing generated practice exams all have linked questions but were left disabled.
-- Publish only exams that have at least one linked question.
update public.exams e
set is_active = true,
    is_public = true,
    updated_at = now()
where exists (
  select 1 from public.exam_questions eq where eq.exam_id = e.id
);
