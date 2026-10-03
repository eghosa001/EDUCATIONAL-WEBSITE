-- Secure server-side sessions for class practice.
create table if not exists public.class_practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  questions jsonb not null default '[]'::jsonb,
  question_count integer not null check (question_count between 1 and 50),
  status varchar(20) not null default 'active' check (status in ('active','submitted','expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  submitted_at timestamptz,
  score integer,
  percentage numeric(5,2)
);

create index if not exists class_practice_sessions_user_status_idx
  on public.class_practice_sessions (user_id,status,started_at desc);
create index if not exists class_practice_sessions_class_subject_idx
  on public.class_practice_sessions (class_id,subject_id);

alter table public.class_practice_sessions enable row level security;
revoke all on table public.class_practice_sessions from anon,authenticated,service_role;
grant select,insert,update,delete on table public.class_practice_sessions to service_role;
