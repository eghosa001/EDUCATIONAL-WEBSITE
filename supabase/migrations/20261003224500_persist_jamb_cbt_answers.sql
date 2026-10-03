-- Persist JAMB CBT answers server-side so the total timer is enforceable.
alter table public.jamb_cbt_sessions
  add column if not exists answers jsonb not null default '{}'::jsonb;
