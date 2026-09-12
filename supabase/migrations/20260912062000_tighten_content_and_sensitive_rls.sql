-- Production hardening verified against xanrzsszrysianxhpprk on 2026-09-12.
-- Keep public lesson visibility quality-gated and prevent ordinary authenticated
-- users from reading other users' sensitive records.

DROP POLICY IF EXISTS lessons_read_all ON public.lessons;
CREATE POLICY lessons_read_all ON public.lessons
FOR SELECT TO public
USING (
  (is_published = true AND content_quality IS DISTINCT FROM 'needs_review')
  OR (
    (SELECT auth.role()) = 'authenticated'
    AND (has_role('admin') OR has_role('super_admin'))
  )
);

DROP POLICY IF EXISTS exam_attempts_admin_read ON public.exam_attempts;
CREATE POLICY exam_attempts_admin_read ON public.exam_attempts
FOR SELECT TO authenticated
USING (has_role('admin') OR has_role('super_admin'));

DROP POLICY IF EXISTS quiz_attempts_admin_read ON public.quiz_attempts;
CREATE POLICY quiz_attempts_admin_read ON public.quiz_attempts
FOR SELECT TO authenticated
USING (has_role('admin') OR has_role('super_admin'));

DROP POLICY IF EXISTS submissions_admin_read ON public.submissions;
CREATE POLICY submissions_admin_read ON public.submissions
FOR SELECT TO authenticated
USING (has_role('admin') OR has_role('super_admin') OR has_role('teacher'));

DROP POLICY IF EXISTS users_admin_read ON public.users;
CREATE POLICY users_admin_read ON public.users
FOR SELECT TO authenticated
USING (has_role('admin') OR has_role('super_admin'));

-- Do not expose every profile to every signed-in account. Existing own-row and
-- administrator policies remain in force.
DROP POLICY IF EXISTS profiles_select_all_authenticated ON public.profiles;

-- Service-role/backend writes bypass RLS; a public INSERT TRUE policy is not
-- necessary and would allow arbitrary metadata insertion by clients.
DROP POLICY IF EXISTS past_question_files_insert_backend ON public.past_question_files;
