-- Make class-practice answer-key storage explicitly inaccessible to browser roles
-- and cover the remaining subject foreign key.
create index if not exists class_practice_sessions_subject_idx
  on public.class_practice_sessions (subject_id);

drop policy if exists class_practice_sessions_deny_clients on public.class_practice_sessions;
create policy class_practice_sessions_deny_clients
on public.class_practice_sessions
for all
to anon, authenticated
using (false)
with check (false);
