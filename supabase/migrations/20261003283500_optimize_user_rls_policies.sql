-- Make high-traffic user RLS policies evaluate auth.uid() once per statement.
-- Remove redundant own-read policies already subsumed by the corresponding read policy.

alter policy bookmarks_delete_own on public.bookmarks
  using (user_id = (select auth.uid()));
alter policy bookmarks_insert_own on public.bookmarks
  with check (user_id = (select auth.uid()));
alter policy bookmarks_select_own on public.bookmarks
  using (user_id = (select auth.uid()));

alter policy exam_attempts_update_own on public.exam_attempts
  using (student_id = (select auth.uid()))
  with check (student_id = (select auth.uid()));

alter policy live_classes_teacher_delete on public.live_classes
  using ((teacher_id = (select auth.uid())) and has_role('teacher'::text));
alter policy live_classes_teacher_insert on public.live_classes
  with check ((teacher_id = (select auth.uid())) and has_role('teacher'::text));
alter policy live_classes_teacher_update on public.live_classes
  using ((teacher_id = (select auth.uid())) and has_role('teacher'::text))
  with check ((teacher_id = (select auth.uid())) and has_role('teacher'::text));

alter policy notifications_delete_own on public.notifications
  using (user_id = (select auth.uid()));

drop policy if exists invoices_read_own on public.invoices;
drop policy if exists payments_read_own on public.payments;
drop policy if exists subscriptions_read_own on public.subscriptions;
