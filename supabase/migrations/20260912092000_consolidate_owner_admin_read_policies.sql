begin;

do $$
declare
  t text;
begin
  foreach t in array array[
    'ai_conversations','ai_usage','coupon_usages','notifications',
    'points_history','student_points','user_rewards'
  ]
  loop
    execute format('drop policy if exists %I_admin_read on public.%I', t, t);
    execute format('drop policy if exists %I_select_own on public.%I', t, t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select to authenticated using (user_id = (select auth.uid()) or public.has_role(''super_admin''))',
      t, t
    );
  end loop;
end $$;

drop policy if exists student_courses_admin_read on public.student_courses;
drop policy if exists student_courses_select_own on public.student_courses;
drop policy if exists student_courses_read on public.student_courses;
create policy student_courses_read on public.student_courses
for select to authenticated
using (student_id = (select auth.uid()) or public.has_role('super_admin'));

drop policy if exists users_admin_read on public.users;
drop policy if exists users_select_own on public.users;
drop policy if exists users_read on public.users;
create policy users_read on public.users
for select to authenticated
using (id = (select auth.uid()) or public.has_role('super_admin'));

drop policy if exists ai_messages_admin_read on public.ai_messages;
drop policy if exists ai_messages_select_own on public.ai_messages;
drop policy if exists ai_messages_read on public.ai_messages;
create policy ai_messages_read on public.ai_messages
for select to authenticated
using (
  public.has_role('super_admin')
  or exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and c.user_id = (select auth.uid())
  )
);

commit;
