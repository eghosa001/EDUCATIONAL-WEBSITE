drop policy if exists classes_admin_read on public.classes;
create policy classes_admin_read
on public.classes
for select
to authenticated
using (has_role('super_admin') or has_role('content_admin'));

drop policy if exists subjects_admin_read on public.subjects;
create policy subjects_admin_read
on public.subjects
for select
to authenticated
using (has_role('super_admin') or has_role('content_admin'));
