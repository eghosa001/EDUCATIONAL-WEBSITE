begin;

-- Curriculum catalog: anonymous users see active rows only; authenticated users
-- see active rows plus inactive rows when they are content/super administrators.
do $$
declare
  t text;
begin
  foreach t in array array[
    'education_systems','education_levels','programs','classes',
    'terms','subjects','topics','subtopics'
  ]
  loop
    execute format('drop policy if exists %I_public_read on public.%I', t, t);
    execute format('drop policy if exists %I_admin_read on public.%I', t, t);
    execute format('drop policy if exists %I_anon_read on public.%I', t, t);
    execute format('drop policy if exists %I_authenticated_read on public.%I', t, t);

    execute format(
      'create policy %I_anon_read on public.%I for select to anon using (is_active = true)',
      t, t
    );
    execute format(
      'create policy %I_authenticated_read on public.%I for select to authenticated using (is_active = true or public.has_role(''super_admin'') or public.has_role(''content_admin''))',
      t, t
    );
  end loop;
end $$;

drop policy if exists class_subjects_public_read on public.class_subjects;
drop policy if exists class_subjects_admin_read on public.class_subjects;
drop policy if exists class_subjects_anon_read on public.class_subjects;
drop policy if exists class_subjects_authenticated_read on public.class_subjects;
create policy class_subjects_anon_read on public.class_subjects for select to anon using (true);
create policy class_subjects_authenticated_read on public.class_subjects for select to authenticated using (true);

drop policy if exists user_roles_admin_read on public.user_roles;
drop policy if exists user_roles_select_own on public.user_roles;
drop policy if exists user_roles_read on public.user_roles;
create policy user_roles_read on public.user_roles
for select to authenticated
using (
  user_id = (select auth.uid())
  or public.has_role('super_admin')
  or public.has_role('content_admin')
);

drop policy if exists roles_admin_read on public.roles;
drop policy if exists roles_select_assigned on public.roles;
drop policy if exists roles_read on public.roles;
create policy roles_read on public.roles
for select to authenticated
using (
  exists (
    select 1 from public.user_roles ur
    where ur.role_id = roles.id
      and ur.user_id = (select auth.uid())
  )
  or public.has_role('super_admin')
  or public.has_role('content_admin')
);

commit;
