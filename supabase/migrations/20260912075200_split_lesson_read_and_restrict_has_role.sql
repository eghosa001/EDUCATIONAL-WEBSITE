drop policy if exists lessons_read_all on public.lessons;
create policy lessons_public_read
on public.lessons
for select
to public
using (is_published = true and content_quality is distinct from 'needs_review');

create policy lessons_admin_read
on public.lessons
for select
to authenticated
using (has_role('super_admin') or has_role('content_admin'));

revoke execute on function public.has_role(text) from anon;
grant execute on function public.has_role(text) to authenticated;
