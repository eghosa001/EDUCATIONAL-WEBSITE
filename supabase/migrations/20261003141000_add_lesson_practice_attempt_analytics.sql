-- Capture lesson-practice outcomes so progress analytics can identify strong and weak topics.
create table if not exists public.lesson_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  topic_id uuid references public.topics(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  question_index integer not null check (question_index between 0 and 9),
  selected_answer_id text not null check (length(selected_answer_id) between 1 and 4),
  is_correct boolean not null,
  generation_method text not null default 'grounded-fallback'
    check (generation_method in ('ai','grounded-fallback')),
  created_at timestamptz not null default now()
);

create index if not exists lesson_practice_attempts_user_created_idx
  on public.lesson_practice_attempts (user_id, created_at desc);
create index if not exists lesson_practice_attempts_user_topic_idx
  on public.lesson_practice_attempts (user_id, topic_id, created_at desc)
  where topic_id is not null;
create index if not exists lesson_practice_attempts_user_subject_idx
  on public.lesson_practice_attempts (user_id, subject_id, created_at desc)
  where subject_id is not null;

alter table public.lesson_practice_attempts enable row level security;

revoke all on table public.lesson_practice_attempts from anon, authenticated, service_role;
grant select on table public.lesson_practice_attempts to authenticated;
grant select, insert on table public.lesson_practice_attempts to service_role;

drop policy if exists lesson_practice_attempts_select_own on public.lesson_practice_attempts;
create policy lesson_practice_attempts_select_own
on public.lesson_practice_attempts
for select
to authenticated
using (user_id = (select auth.uid()));
