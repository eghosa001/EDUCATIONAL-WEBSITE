-- Original THE GUIDE exam-aligned practice built from verified online sources.
-- This bank is intentionally separate from historical past_questions.

create table if not exists public.verified_practice_questions (
  id uuid primary key default gen_random_uuid(),
  board text not null check (board in ('jamb','waec','neco','nabteb')),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_label text not null,
  question_text text not null,
  options jsonb not null check (jsonb_typeof(options)='array' and jsonb_array_length(options)=4),
  correct_answer text not null check (correct_answer in ('A','B','C','D')),
  explanation text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  source_title text not null,
  source_url text,
  verification_method text not null,
  verified_at timestamptz not null default now(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists verified_practice_question_unique
  on public.verified_practice_questions(board,subject_id,md5(question_text));
create index if not exists verified_practice_board_subject_idx
  on public.verified_practice_questions(board,subject_id) where is_active=true;
alter table public.verified_practice_questions enable row level security;
drop policy if exists verified_practice_questions_no_client_access on public.verified_practice_questions;
create policy verified_practice_questions_no_client_access
  on public.verified_practice_questions for all to anon, authenticated using (false) with check (false);
revoke all on table public.verified_practice_questions from public,anon,authenticated;
grant select,insert,update,delete on table public.verified_practice_questions to service_role;

create table if not exists public.verified_practice_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  board text not null check (board in ('jamb','waec','neco','nabteb')),
  subject_id uuid references public.subjects(id) on delete set null,
  question_count integer not null check (question_count>0),
  answered_count integer not null default 0,
  correct_count integer not null default 0,
  percentage numeric(6,2) not null default 0,
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default now()
);
alter table public.verified_practice_attempts enable row level security;
drop policy if exists verified_practice_attempts_own_read on public.verified_practice_attempts;
create policy verified_practice_attempts_own_read
  on public.verified_practice_attempts for select to authenticated using ((select auth.uid())=user_id);
revoke insert,update,delete on table public.verified_practice_attempts from anon,authenticated;
grant select on table public.verified_practice_attempts to authenticated;
grant select,insert,update,delete on table public.verified_practice_attempts to service_role;

create or replace function public.get_verified_practice_availability()
returns jsonb language sql stable security definer set search_path=public
as $$
  with grouped as (
    select board,subject_id,count(*)::int question_count
    from public.verified_practice_questions where is_active=true group by board,subject_id
  ), per_board as (
    select board,jsonb_build_object(
      'questionCount',sum(question_count),
      'subjectIds',jsonb_agg(subject_id order by subject_id),
      'subjectCounts',jsonb_object_agg(subject_id::text,question_count)
    ) value from grouped group by board
  )
  select coalesce(jsonb_object_agg(board,value),'{}'::jsonb) from per_board;
$$;
revoke all on function public.get_verified_practice_availability() from public,anon,authenticated;
grant execute on function public.get_verified_practice_availability() to service_role;
