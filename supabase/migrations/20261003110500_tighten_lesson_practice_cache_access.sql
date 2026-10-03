-- Keep lesson-practice answer keys server-only while making the intent explicit.
revoke all on table public.lesson_practice_sets from service_role;
grant select, insert, update, delete on table public.lesson_practice_sets to service_role;

drop policy if exists lesson_practice_sets_no_client_access on public.lesson_practice_sets;
create policy lesson_practice_sets_no_client_access
on public.lesson_practice_sets
for all
to anon, authenticated
using (false)
with check (false);
