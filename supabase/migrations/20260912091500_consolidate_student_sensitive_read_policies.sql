begin;

do $$
declare
  t text;
begin
  foreach t in array array['exam_attempts','lesson_progress','quiz_attempts','study_sessions']
  loop
    execute format('drop policy if exists %I_admin_read on public.%I', t, t);
    execute format('drop policy if exists %I_select_own on public.%I', t, t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select to authenticated using (student_id = (select auth.uid()) or public.has_role(''super_admin''))',
      t, t
    );
  end loop;
end $$;

drop policy if exists exam_answers_admin_read on public.exam_answers;
drop policy if exists exam_answers_select_own on public.exam_answers;
drop policy if exists exam_answers_read on public.exam_answers;
create policy exam_answers_read on public.exam_answers
for select to authenticated
using (
  public.has_role('super_admin')
  or exists (
    select 1 from public.exam_attempts e
    where e.id = exam_answers.attempt_id
      and e.student_id = (select auth.uid())
  )
);

drop policy if exists submissions_admin_read on public.submissions;
drop policy if exists submissions_select_own on public.submissions;
drop policy if exists submissions_read on public.submissions;
create policy submissions_read on public.submissions
for select to authenticated
using (
  student_id = (select auth.uid())
  or public.has_role('teacher')
  or public.has_role('super_admin')
);

commit;
