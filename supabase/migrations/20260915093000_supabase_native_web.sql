-- Supabase-native learner workflows: read/write only through RLS and narrow RPCs.

DROP POLICY IF EXISTS assignments_learner_read ON public.assignments;
CREATE POLICY assignments_learner_read ON public.assignments FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS submissions_teacher_update ON public.submissions;
CREATE POLICY submissions_teacher_update ON public.submissions FOR UPDATE TO authenticated
USING (has_role('teacher'::text) OR has_role('super_admin'::text))
WITH CHECK (has_role('teacher'::text) OR has_role('super_admin'::text));

DROP POLICY IF EXISTS live_classes_learner_read ON public.live_classes;
CREATE POLICY live_classes_learner_read ON public.live_classes FOR SELECT TO authenticated USING (status <> 'cancelled');
DROP POLICY IF EXISTS live_classes_teacher_insert ON public.live_classes;
CREATE POLICY live_classes_teacher_insert ON public.live_classes FOR INSERT TO authenticated
WITH CHECK (teacher_id = auth.uid() AND has_role('teacher'::text));
DROP POLICY IF EXISTS live_classes_teacher_update ON public.live_classes;
CREATE POLICY live_classes_teacher_update ON public.live_classes FOR UPDATE TO authenticated
USING (teacher_id = auth.uid() AND has_role('teacher'::text)) WITH CHECK (teacher_id = auth.uid() AND has_role('teacher'::text));
DROP POLICY IF EXISTS live_classes_teacher_delete ON public.live_classes;
CREATE POLICY live_classes_teacher_delete ON public.live_classes FOR DELETE TO authenticated
USING (teacher_id = auth.uid() AND has_role('teacher'::text));

DROP POLICY IF EXISTS library_resources_learner_read ON public.library_resources;
CREATE POLICY library_resources_learner_read ON public.library_resources FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS subscription_plans_public_read ON public.subscription_plans;
CREATE POLICY subscription_plans_public_read ON public.subscription_plans FOR SELECT TO public USING (is_active = true);
DROP POLICY IF EXISTS subscriptions_read_own ON public.subscriptions;
CREATE POLICY subscriptions_read_own ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS invoices_read_own ON public.invoices;
CREATE POLICY invoices_read_own ON public.invoices FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS payments_read_own ON public.payments;
CREATE POLICY payments_read_own ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS exams_learner_read ON public.exams;
CREATE POLICY exams_learner_read ON public.exams FOR SELECT TO authenticated USING (is_active = true AND is_public = true);
DROP POLICY IF EXISTS exam_attempts_update_own ON public.exam_attempts;
CREATE POLICY exam_attempts_update_own ON public.exam_attempts FOR UPDATE TO authenticated
USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.cbt_get_exam_questions(p_exam_id uuid)
RETURNS TABLE(
  id uuid,
  question_text text,
  question_type varchar,
  options jsonb,
  difficulty varchar,
  section_name varchar,
  marks numeric,
  order_index integer
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.exams e WHERE e.id=p_exam_id AND e.is_active=true AND e.is_public=true) THEN
    RAISE EXCEPTION 'Exam not available';
  END IF;
  RETURN QUERY
  SELECT q.id,q.question_text,q.question_type,q.options,q.difficulty,eq.section_name,eq.marks,eq.order_index
  FROM public.exam_questions eq JOIN public.questions q ON q.id=eq.question_id
  WHERE eq.exam_id=p_exam_id AND q.is_active=true
  ORDER BY eq.order_index;
END;
$$;
REVOKE ALL ON FUNCTION public.cbt_get_exam_questions(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cbt_get_exam_questions(uuid) TO authenticated;
