-- Persist graded past-question CBT history for learner analytics.
create table if not exists public.past_question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board varchar(32) not null,
  year integer,
  question_count integer not null check (question_count >= 0),
  answered_count integer not null default 0 check (answered_count >= 0),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  unanswered_count integer not null default 0 check (unanswered_count >= 0),
  percentage numeric(5,2) not null default 0 check (percentage >= 0 and percentage <= 100),
  time_spent_seconds integer not null default 0 check (time_spent_seconds >= 0),
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists past_question_attempts_user_submitted_idx
  on public.past_question_attempts (user_id, submitted_at desc);
create index if not exists past_question_attempts_user_board_idx
  on public.past_question_attempts (user_id, board, submitted_at desc);

alter table public.past_question_attempts enable row level security;

revoke all on table public.past_question_attempts from anon, authenticated, service_role;
grant select on table public.past_question_attempts to authenticated;
grant select, insert, update, delete on table public.past_question_attempts to service_role;

drop policy if exists past_question_attempts_select_own on public.past_question_attempts;
create policy past_question_attempts_select_own
on public.past_question_attempts
for select to authenticated
using (user_id = (select auth.uid()));
