-- Security hardening: AI quota accounting and client-side write restrictions.
-- Backend/Edge Functions use the service role for privileged writes; browser clients
-- should never be able to mint financial/gamification/notification records.

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id, date ORDER BY id) AS rn,
         SUM(COALESCE(questions_asked, 0)) OVER (PARTITION BY user_id, date) AS total_questions,
         SUM(COALESCE(tokens_used, 0)) OVER (PARTITION BY user_id, date) AS total_tokens
  FROM public.ai_usage
), merged AS (
  SELECT user_id, date, MAX(total_questions) AS questions_asked, MAX(total_tokens) AS tokens_used
  FROM public.ai_usage a JOIN ranked r ON r.id = a.id GROUP BY user_id, date
), deleted AS (
  DELETE FROM public.ai_usage a USING ranked r WHERE a.id = r.id AND r.rn > 1 RETURNING a.id
)
UPDATE public.ai_usage a SET questions_asked = m.questions_asked, tokens_used = m.tokens_used
FROM merged m WHERE a.user_id = m.user_id AND a.date = m.date;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_usage_user_date ON public.ai_usage(user_id, date);

CREATE OR REPLACE FUNCTION public.consume_ai_request(p_user_id uuid, p_daily_limit integer DEFAULT 100)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE current_count integer;
BEGIN
  INSERT INTO public.ai_usage (user_id, date, questions_asked, tokens_used, conversations_started)
  VALUES (p_user_id, CURRENT_DATE, 1, 0, 0)
  ON CONFLICT (user_id, date) DO UPDATE SET questions_asked = public.ai_usage.questions_asked + 1
  RETURNING questions_asked INTO current_count;
  IF current_count > p_daily_limit THEN
    UPDATE public.ai_usage SET questions_asked = GREATEST(questions_asked - 1, 0)
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    RETURN false;
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_ai_request(p_user_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.ai_usage SET questions_asked = GREATEST(questions_asked - 1, 0)
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
$$;
REVOKE ALL ON FUNCTION public.consume_ai_request(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_ai_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_request(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_request(uuid) TO service_role;

DROP POLICY IF EXISTS "notifications_insert_any" ON public.notifications;
DROP POLICY IF EXISTS "points_history_insert_own" ON public.points_history;
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
DROP POLICY IF EXISTS "wallet_transactions_insert_own" ON public.wallet_transactions;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;

DROP POLICY IF EXISTS "users_select_for_auth" ON public.users;
DROP POLICY IF EXISTS "users_admin_read" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);

-- Replace the previous migration's broad authenticated-user OR role policies.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT pol.polname, c.relname
    FROM pg_policy pol JOIN pg_class c ON c.oid = pol.polrelid
    WHERE c.relnamespace = 'public'::regnamespace
      AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%auth.uid() IS NOT NULL%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.polname, r.relname);
  END LOOP;
END $$;

-- Explicitly recreate safe admin reads for the security-sensitive tables.
CREATE POLICY "student_points_admin_read" ON public.student_points FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "points_history_admin_read" ON public.points_history FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "achievements_admin_read" ON public.achievements FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "rewards_admin_read" ON public.rewards FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "user_rewards_admin_read" ON public.user_rewards FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "ai_conversations_admin_read" ON public.ai_conversations FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "ai_messages_admin_read" ON public.ai_messages FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "ai_usage_admin_read" ON public.ai_usage FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "notifications_admin_read" ON public.notifications FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "flashcards_admin_read" ON public.flashcards FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "flashcard_reviews_admin_read" ON public.flashcard_reviews FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "wallets_admin_read" ON public.wallets FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "wallet_transactions_admin_read" ON public.wallet_transactions FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "payments_admin_read" ON public.payments FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "transactions_admin_read" ON public.transactions FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "invoices_admin_read" ON public.invoices FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "subscriptions_admin_read" ON public.subscriptions FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "payment_methods_admin_read" ON public.payment_methods FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "coupon_usages_admin_read" ON public.coupon_usages FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "lesson_progress_admin_read" ON public.lesson_progress FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "study_sessions_admin_read" ON public.study_sessions FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "student_courses_admin_read" ON public.student_courses FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "quiz_attempts_admin_read" ON public.quiz_attempts FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "exam_attempts_admin_read" ON public.exam_attempts FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "exam_answers_admin_read" ON public.exam_answers FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "submissions_admin_read" ON public.submissions FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "assignments_admin_read" ON public.assignments FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));

DROP POLICY IF EXISTS "user_roles_admin_read" ON public.user_roles;
DROP POLICY IF EXISTS "roles_admin_read" ON public.roles;
CREATE POLICY "user_roles_admin_read" ON public.user_roles FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
CREATE POLICY "roles_admin_read" ON public.roles FOR SELECT USING ((auth.jwt() ->> 'role') IN ('admin','super_admin'));
