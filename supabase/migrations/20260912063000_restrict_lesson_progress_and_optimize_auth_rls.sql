-- Close an authorization hole where any authenticated user matched the
-- lesson_progress_admin_read policy through `auth.uid() is not null`.
drop policy if exists lesson_progress_admin_read on public.lesson_progress;
create policy lesson_progress_admin_read
on public.lesson_progress
for select
to authenticated
using (has_role('admin'::text) or has_role('super_admin'::text));

-- Keep owner-scoped policies semantically identical while avoiding per-row
-- re-evaluation of auth.uid() in common high-traffic tables.
alter policy lesson_progress_select_own on public.lesson_progress
using (student_id = (select auth.uid()));

alter policy lesson_progress_upsert_own on public.lesson_progress
using (student_id = (select auth.uid()))
with check (student_id = (select auth.uid()));

alter policy study_sessions_select_own on public.study_sessions
using (student_id = (select auth.uid()));

alter policy study_sessions_insert_own on public.study_sessions
with check (student_id = (select auth.uid()));

alter policy study_sessions_update_own on public.study_sessions
using (student_id = (select auth.uid()));

alter policy quiz_attempts_select_own on public.quiz_attempts
using (student_id = (select auth.uid()));

alter policy quiz_attempts_insert_own on public.quiz_attempts
with check (student_id = (select auth.uid()));

alter policy exam_attempts_select_own on public.exam_attempts
using (student_id = (select auth.uid()));

alter policy exam_attempts_insert_own on public.exam_attempts
with check (student_id = (select auth.uid()));

alter policy submissions_select_own on public.submissions
using (student_id = (select auth.uid()));

alter policy submissions_insert_own on public.submissions
with check (student_id = (select auth.uid()));

alter policy profiles_select_own on public.profiles
using ((select auth.uid()) = id);

alter policy profiles_insert_own on public.profiles
with check ((select auth.uid()) = id);

alter policy profiles_update_own on public.profiles
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

alter policy users_select_own on public.users
using ((select auth.uid()) = id);

alter policy users_insert_own on public.users
with check ((select auth.uid()) = id);

alter policy users_update_own on public.users
using ((select auth.uid()) = id);

-- Avoid re-evaluating the auth role for every lesson row while preserving the
-- existing public-published / admin-unpublished visibility rule.
alter policy lessons_read_all on public.lessons
using (
  ((is_published = true) and (content_quality is distinct from 'needs_review'::text))
  or (((select auth.role()) = 'authenticated'::text) and (has_role('admin'::text) or has_role('super_admin'::text)))
);
