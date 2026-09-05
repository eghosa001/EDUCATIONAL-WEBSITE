-- Exam configuration is server/admin-managed. Students only need to read it.
DROP POLICY IF EXISTS "Authenticated users can manage exam subjects" ON public.exam_subjects;
DROP POLICY IF EXISTS "Admins can manage exam subjects" ON public.exam_subjects;

CREATE POLICY "Admins can manage exam subjects"
  ON public.exam_subjects FOR ALL
  TO authenticated
  USING ((auth.jwt() ->> 'role') IN ('admin', 'super_admin', 'content_admin'))
  WITH CHECK ((auth.jwt() ->> 'role') IN ('admin', 'super_admin', 'content_admin'));
