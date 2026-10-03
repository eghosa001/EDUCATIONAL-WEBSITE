-- Persist per-user notification preferences in Supabase.
create table if not exists public.user_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  channel varchar(32) not null,
  notification_type varchar(64) not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, channel, notification_type)
);

create index if not exists user_notification_preferences_user_idx
  on public.user_notification_preferences (user_id);

alter table public.user_notification_preferences enable row level security;

revoke all on table public.user_notification_preferences from anon, authenticated, service_role;
grant select, insert, update, delete on table public.user_notification_preferences to authenticated;
grant all on table public.user_notification_preferences to service_role;

drop policy if exists user_notification_preferences_select_own on public.user_notification_preferences;
drop policy if exists user_notification_preferences_insert_own on public.user_notification_preferences;
drop policy if exists user_notification_preferences_update_own on public.user_notification_preferences;
drop policy if exists user_notification_preferences_delete_own on public.user_notification_preferences;

create policy user_notification_preferences_select_own
on public.user_notification_preferences for select to authenticated
using (user_id = (select auth.uid()));

create policy user_notification_preferences_insert_own
on public.user_notification_preferences for insert to authenticated
with check (user_id = (select auth.uid()));

create policy user_notification_preferences_update_own
on public.user_notification_preferences for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy user_notification_preferences_delete_own
on public.user_notification_preferences for delete to authenticated
using (user_id = (select auth.uid()));
