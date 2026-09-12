drop policy if exists user_roles_select_own on public.user_roles;
create policy user_roles_select_own on public.user_roles
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists roles_select_assigned on public.roles;
create policy roles_select_assigned on public.roles
for select to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.role_id = roles.id
      and ur.user_id = (select auth.uid())
  )
);
