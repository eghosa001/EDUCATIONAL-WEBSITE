begin;

drop policy if exists parent_children_admin_read on public.parent_children;
drop policy if exists parent_children_child_read on public.parent_children;
drop policy if exists parent_children_select_own on public.parent_children;
drop policy if exists parent_children_read on public.parent_children;
create policy parent_children_read on public.parent_children
for select to authenticated
using (
  parent_id = (select auth.uid())
  or child_user_id = (select auth.uid())
  or public.has_role('super_admin')
);

drop policy if exists "Admin manage file metadata" on public.past_question_files;
drop policy if exists "Public read file metadata" on public.past_question_files;
drop policy if exists past_question_files_select_all on public.past_question_files;
drop policy if exists past_question_files_insert_admin on public.past_question_files;
drop policy if exists past_question_files_update_admin on public.past_question_files;
drop policy if exists past_question_files_delete_admin on public.past_question_files;
create policy past_question_files_read on public.past_question_files
for select to public
using (true);
create policy past_question_files_insert_admin on public.past_question_files
for insert to authenticated
with check (
  public.has_role('super_admin')
  or public.has_role('content_admin')
  or public.has_role('teacher')
);
create policy past_question_files_update_admin on public.past_question_files
for update to authenticated
using (
  public.has_role('super_admin')
  or public.has_role('content_admin')
  or public.has_role('teacher')
)
with check (
  public.has_role('super_admin')
  or public.has_role('content_admin')
  or public.has_role('teacher')
);
create policy past_question_files_delete_admin on public.past_question_files
for delete to authenticated
using (public.has_role('super_admin') or public.has_role('content_admin'));

drop policy if exists profiles_admin_read on public.profiles;
drop policy if exists profiles_admin_write on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_read on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.has_role('super_admin'));
create policy profiles_insert on public.profiles
for insert to authenticated
with check (id = (select auth.uid()) or public.has_role('super_admin'));
create policy profiles_update on public.profiles
for update to authenticated
using (id = (select auth.uid()) or public.has_role('super_admin'))
with check (id = (select auth.uid()) or public.has_role('super_admin'));
create policy profiles_delete_admin on public.profiles
for delete to authenticated
using (public.has_role('super_admin'));

commit;
