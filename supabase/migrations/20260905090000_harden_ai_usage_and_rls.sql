-- Security hardening: AI quota accounting and client-side write restrictions.
-- Backend/Edge Functions use the service role for privileged writes; browser clients
-- should never be able to mint financial/gamification/notification records.

-- Ensure one daily AI usage row per user.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id, date ORDER BY id) AS rn,
         SUM(COALESCE(questions_asked, 0)) OVER (PARTITION BY user_id, date) AS total_questions,
         SUM(COALESCE(tokens_used, 0)) OVER (PARTITION BY user_id, date) AS total_tokens
  FROM public.ai_usage
), merged AS (
  SELECT user_id, date, MAX(total_questions) AS questions_asked, MAX(total_tokens) AS tokens_used
  FROM public.ai_usage a
  JOIN ranked r ON r.id = a.id
  GROUP BY user_id, date
), deleted AS (
  DELETE FROM public.ai_usage a
  USING ranked r
  WHERE a.id = r.id AND r.rn > 1
  RETURNING a.id
)
UPDATE public.ai_usage a
SET questions_asked = m.questions_asked,
    tokens_used = m.tokens_used
FROM merged m
WHERE a.user_id = m.user_id AND a.date = m.date;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_usage_user_date ON public.ai_usage(user_id, date);

CREATE OR REPLACE FUNCTION public.consume_ai_request(p_user_id uuid, p_daily_limit integer DEFAULT 100)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
BEGIN
  INSERT INTO public.ai_usage (user_id, date, questions_asked, tokens_used, conversations_started)
  VALUES (p_user_id, CURRENT_DATE, 1, 0, 0)
  ON CONFLICT (user_id, date)
  DO UPDATE SET questions_asked = public.ai_usage.questions_asked + 1
  RETURNING questions_asked INTO current_count;

  IF current_count > p_daily_limit THEN
    UPDATE public.ai_usage
    SET questions_asked = GREATEST(questions_asked - 1, 0)
    WHERE user_id = p_user_id AND date = CURRENT_DATE;
    RETURN false;
  END IF;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_ai_request(p_user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.ai_usage
  SET questions_asked = GREATEST(questions_asked - 1, 0)
  WHERE user_id = p_user_id AND date = CURRENT_DATE;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_request(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_ai_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.consume_ai_request(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_request(uuid) TO service_role;

-- Browser clients must not create or modify server-derived records directly.
DROP POLICY IF EXISTS "notifications_insert_any" ON public.notifications;
DROP POLICY IF EXISTS "points_history_insert_own" ON public.points_history;
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
DROP POLICY IF EXISTS "wallet_transactions_insert_own" ON public.wallet_transactions;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;

-- The users table must never be publicly selectable: it contains authentication and
-- account data. Authenticated users may only read their own row; admins read through
-- the backend/service role rather than a broad client-side policy.
DROP POLICY IF EXISTS "users_select_for_auth" ON public.users;
DROP POLICY IF EXISTS "users_admin_read" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Fix the previous migration's overly broad "admin" policies. An authenticated user
-- is not automatically an administrator.
DROP POLICY IF EXISTS "student_points_admin_read" ON public.student_points;
DROP POLICY IF EXISTS "points_history_admin_read" ON public.points_history;
DROP POLICY IF EXISTS "achievements_admin_read" ON public.achievements;
DROP POLICY IF EXISTS "rewards_admin_read" ON public.rewards;
DROP POLICY IF EXISTS "user_rewards_admin_read" ON public.user_rewards;
DROP POLICY IF EXISTS "ai_conversations_admin_read" ON public.ai_conversations;
DROP POLICY IF EXISTS "ai_messages_admin_read" ON public.ai_messages;
DROP POLICY IF EXISTS "ai_usage_admin_read" ON public.ai_usage;
DROP POLICY IF EXISTS "notifications_admin_read" ON public.notifications;
DROP POLICY IF EXISTS "flashcards_admin_read" ON public.flashcards;
DROP POLICY IF EXISTS "flashcard_reviews_admin_read" ON public.flashcard_reviews;
DROP POLICY IF EXISTS "wallets_admin_read" ON public.wallets;
DROP POLICY IF EXISTS "wallet_transactions_admin_read" ON public.wallet_transactions;
DROP POLICY IF EXISTS "payments_admin_read" ON public.payments;
DROP POLICY IF EXISTS "transactions_admin_read" ON public.transactions;
DROP POLICY IF EXISTS "invoices_admin_read" ON public.invoices;
DROP POLICY IF EXISTS "subscriptions_admin_read" ON public.subscriptions;
DROP POLICY IF EXISTS "payment_methods_admin_read" ON public.payment_methods;
DROP POLICY IF EXISTS "coupon_usages_admin_read" ON public.coupon_usages;
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON public.lesson_progress;
DROP POLICY IF EXISTS "study_sessions_admin_read" ON public.study_sessions;
DROP POLICY IF EXISTS "student_courses_admin_read" ON public.student_courses;
DROP POLICY IF EXISTS "quiz_attempts_admin_read" ON public.quiz_attempts;
DROP POLICY IF EXISTS "exam_attempts_admin_read" ON public.exam_attempts;
DROP POLICY IF EXISTS "exam_answers_admin_read" ON public.exam_answers;
DROP POLICY IF EXISTS "submissions_admin_read" ON public.submissions;
DROP POLICY IF EXISTS "assignments_admin_read" ON public.assignments;

-- Admin access is intentionally expressed as a role claim only. Backend service-role
-- queries remain available and are not constrained by these policies.
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
