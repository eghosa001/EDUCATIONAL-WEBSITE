drop policy if exists study_sessions_admin_read on public.study_sessions;
create policy study_sessions_admin_read
on public.study_sessions
for select
to authenticated
using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists lesson_progress_upsert_own on public.lesson_progress;
create policy lesson_progress_insert_own
on public.lesson_progress
for insert
to authenticated
with check (student_id = (select auth.uid()));

create policy lesson_progress_update_own
on public.lesson_progress
for update
to authenticated
using (student_id = (select auth.uid()))
with check (student_id = (select auth.uid()));

create policy lesson_progress_delete_own
on public.lesson_progress
for delete
to authenticated
using (student_id = (select auth.uid()));
