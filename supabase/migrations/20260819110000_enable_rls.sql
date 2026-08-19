-- =====================================================
-- RLS Migration — Educational Platform
-- Applied: 2026-08-19
--
-- Because the backend uses custom JWT auth (not Supabase Auth),
-- RLS policies reference current_setting('request.jwt.claims')::json->>'sub'
-- instead of auth.uid().
--
-- The backend must call setJwtContext(client, user) on every DB client
-- before running queries for RLS to work.
-- See backend/src/common/database/index.js.
-- =====================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);

-- -------------------------------------------------
-- 1. Enable RLS on all user-scoped tables
-- -------------------------------------------------
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_courses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_points       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_usages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_children     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_questions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_question_files ENABLE ROW LEVEL SECURITY;
-- Reference tables (already had RLS from prior migration):
ALTER TABLE public.courses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments         ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------
-- 2. Helper function: extract user ID / role from JWT claim
-- -------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS uuid AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS text AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'anonymous'
  );
$$ LANGUAGE sql STABLE;

-- -------------------------------------------------
-- 3. Users table policies
-- -------------------------------------------------
-- Allow unauthenticated lookup by email (needed for login)
CREATE POLICY "users_select_for_auth" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_select_own"        ON public.users FOR SELECT  USING (id = public.current_user_id());
CREATE POLICY "users_update_own"        ON public.users FOR UPDATE  USING (id = public.current_user_id());
CREATE POLICY "users_insert_own"        ON public.users FOR INSERT  WITH CHECK (id = public.current_user_id());
CREATE POLICY "users_admin_read"        ON public.users FOR SELECT  USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 4. Sessions & password_resets — admin-only read
-- -------------------------------------------------
CREATE POLICY "sessions_admin_read"          ON public.sessions          FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "sessions_backend_write"       ON public.sessions          FOR ALL    WITH CHECK (true);
CREATE POLICY "password_resets_admin_read"   ON public.password_resets   FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "password_resets_backend_write" ON public.password_resets  FOR ALL    WITH CHECK (true);

-- -------------------------------------------------
-- 5. Progress & learning (uses student_id, not user_id)
-- -------------------------------------------------
CREATE POLICY "lesson_progress_select_own"    ON public.lesson_progress FOR SELECT USING (student_id = public.current_user_id());
CREATE POLICY "lesson_progress_upsert_own"    ON public.lesson_progress FOR ALL    USING (student_id = public.current_user_id()) WITH CHECK (student_id = public.current_user_id());
CREATE POLICY "lesson_progress_admin_read"    ON public.lesson_progress FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "study_sessions_select_own"     ON public.study_sessions  FOR SELECT USING (student_id = public.current_user_id());
CREATE POLICY "study_sessions_insert_own"     ON public.study_sessions  FOR INSERT WITH CHECK (student_id = public.current_user_id());
CREATE POLICY "study_sessions_update_own"     ON public.study_sessions  FOR UPDATE USING (student_id = public.current_user_id());
CREATE POLICY "study_sessions_admin_read"     ON public.study_sessions  FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "student_courses_select_own"    ON public.student_courses FOR SELECT USING (student_id = public.current_user_id());
CREATE POLICY "student_courses_insert_own"    ON public.student_courses FOR INSERT WITH CHECK (student_id = public.current_user_id());
CREATE POLICY "student_courses_admin_read"    ON public.student_courses FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 6. Courses & lessons — public read, admin write
-- -------------------------------------------------
CREATE POLICY "courses_read_all"       ON public.courses   FOR SELECT USING (true);
CREATE POLICY "courses_insert_admin"   ON public.courses   FOR INSERT WITH CHECK (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "courses_update_admin"   ON public.courses   FOR UPDATE USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "courses_delete_admin"   ON public.courses   FOR DELETE USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "lessons_read_all"       ON public.lessons   FOR SELECT USING (true);
CREATE POLICY "lessons_insert_admin"   ON public.lessons   FOR INSERT WITH CHECK (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "lessons_update_admin"   ON public.lessons   FOR UPDATE USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "lessons_delete_admin"   ON public.lessons   FOR DELETE USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 7. Quizzes & exams
-- -------------------------------------------------
CREATE POLICY "quiz_attempts_select_own"      ON public.quiz_attempts  FOR SELECT USING (student_id = public.current_user_id());
CREATE POLICY "quiz_attempts_insert_own"      ON public.quiz_attempts  FOR INSERT WITH CHECK (student_id = public.current_user_id());
CREATE POLICY "quiz_attempts_admin_read"      ON public.quiz_attempts  FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "exam_attempts_select_own"      ON public.exam_attempts  FOR SELECT USING (student_id = public.current_user_id());
CREATE POLICY "exam_attempts_insert_own"      ON public.exam_attempts  FOR INSERT WITH CHECK (student_id = public.current_user_id());
CREATE POLICY "exam_attempts_admin_read"      ON public.exam_attempts  FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "exam_answers_select_own"       ON public.exam_answers   FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exam_attempts e WHERE e.id = exam_answers.attempt_id AND e.student_id = public.current_user_id())
);
CREATE POLICY "exam_answers_admin_read"       ON public.exam_answers   FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "submissions_select_own"        ON public.submissions    FOR SELECT USING (student_id = public.current_user_id());
CREATE POLICY "submissions_insert_own"        ON public.submissions    FOR INSERT WITH CHECK (student_id = public.current_user_id());
CREATE POLICY "submissions_admin_read"        ON public.submissions    FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "assignments_admin_read"        ON public.assignments    FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 8. Gamification (user_id column)
-- -------------------------------------------------
CREATE POLICY "student_points_select_own"     ON public.student_points FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "points_history_select_own"     ON public.points_history FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "points_history_insert_own"     ON public.points_history FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "achievements_select_own"       ON public.achievements   FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "user_rewards_select_own"       ON public.user_rewards   FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "student_points_admin_read"     ON public.student_points FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "points_history_admin_read"     ON public.points_history FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "achievements_admin_read"       ON public.achievements   FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "rewards_admin_read"            ON public.rewards        FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "user_rewards_admin_read"       ON public.user_rewards   FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 9. AI conversations
-- -------------------------------------------------
CREATE POLICY "ai_conversations_select_own"   ON public.ai_conversations FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "ai_conversations_insert_own"   ON public.ai_conversations FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "ai_conversations_delete_own"   ON public.ai_conversations FOR DELETE USING (user_id = public.current_user_id());
CREATE POLICY "ai_conversations_admin_read"   ON public.ai_conversations FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "ai_messages_select_own"        ON public.ai_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.user_id = public.current_user_id())
);
CREATE POLICY "ai_messages_insert_own"        ON public.ai_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.user_id = public.current_user_id())
);
CREATE POLICY "ai_messages_admin_read"        ON public.ai_messages FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "ai_usage_select_own"           ON public.ai_usage FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "ai_usage_admin_read"           ON public.ai_usage FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 10. Notifications
-- -------------------------------------------------
CREATE POLICY "notifications_select_own"      ON public.notifications FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "notifications_update_own"      ON public.notifications FOR UPDATE USING (user_id = public.current_user_id());
CREATE POLICY "notifications_insert_any"      ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_admin_read"      ON public.notifications FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 11. Flashcards
-- -------------------------------------------------
CREATE POLICY "flashcards_select_own"         ON public.flashcards FOR SELECT USING (created_by = public.current_user_id());
CREATE POLICY "flashcard_reviews_select_own"  ON public.flashcard_reviews FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "flashcards_admin_read"         ON public.flashcards FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "flashcard_reviews_admin_read"  ON public.flashcard_reviews FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 12. Wallet & Payments
-- -------------------------------------------------
CREATE POLICY "wallets_select_own"            ON public.wallets            FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "wallets_insert_own"            ON public.wallets            FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "wallet_transactions_select_own" ON public.wallet_transactions FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "wallet_transactions_insert_own" ON public.wallet_transactions FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "payments_select_own"           ON public.payments           FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "payments_insert_own"           ON public.payments           FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "transactions_select_own"       ON public.transactions       FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "invoices_select_own"           ON public.invoices           FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "subscriptions_select_own"      ON public.subscriptions      FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "payment_methods_select_own"    ON public.payment_methods    FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "coupon_usages_select_own"      ON public.coupon_usages      FOR SELECT USING (user_id = public.current_user_id());
-- Admin read for all financial tables
CREATE POLICY "wallets_admin_read"            ON public.wallets            FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "wallet_transactions_admin_read" ON public.wallet_transactions FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "payments_admin_read"           ON public.payments           FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "transactions_admin_read"       ON public.transactions       FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "invoices_admin_read"           ON public.invoices           FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "subscriptions_admin_read"      ON public.subscriptions      FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "payment_methods_admin_read"    ON public.payment_methods    FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "coupon_usages_admin_read"      ON public.coupon_usages      FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 13. Parents & Children
-- -------------------------------------------------
CREATE POLICY "parents_select_own"            ON public.parents            FOR SELECT USING (user_id = public.current_user_id());
CREATE POLICY "parent_children_select_own"    ON public.parent_children    FOR SELECT USING (parent_id = public.current_user_id());
CREATE POLICY "parent_children_child_read"    ON public.parent_children    FOR SELECT USING (child_user_id = public.current_user_id());
CREATE POLICY "parents_admin_read"            ON public.parents            FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "parent_children_admin_read"    ON public.parent_children    FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 14. Community (public read, user write)
-- -------------------------------------------------
CREATE POLICY "comments_select"               ON public.comments           FOR SELECT USING (true);
CREATE POLICY "comments_insert_own"           ON public.comments           FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "comment_likes_select"          ON public.comment_likes      FOR SELECT USING (true);
CREATE POLICY "comment_likes_insert_own"      ON public.comment_likes      FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "community_posts_select"        ON public.community_posts    FOR SELECT USING (true);
CREATE POLICY "community_posts_insert_own"    ON public.community_posts    FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "community_posts_update_own"    ON public.community_posts    FOR UPDATE USING (user_id = public.current_user_id());
CREATE POLICY "community_posts_delete_own"    ON public.community_posts    FOR DELETE USING (user_id = public.current_user_id());
CREATE POLICY "post_likes_select"             ON public.post_likes         FOR SELECT USING (true);
CREATE POLICY "post_likes_insert_own"         ON public.post_likes         FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "forums_select"                 ON public.forums             FOR SELECT USING (true);
CREATE POLICY "forum_members_select"          ON public.forum_members      FOR SELECT USING (true);
CREATE POLICY "forum_members_insert_own"      ON public.forum_members      FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "study_groups_select"           ON public.study_groups       FOR SELECT USING (true);
CREATE POLICY "study_group_members_select"    ON public.study_group_members FOR SELECT USING (true);
CREATE POLICY "study_group_members_insert_own" ON public.study_group_members FOR INSERT WITH CHECK (user_id = public.current_user_id());
CREATE POLICY "study_group_messages_select"   ON public.study_group_messages FOR SELECT USING (true);
CREATE POLICY "study_group_messages_insert_own" ON public.study_group_messages FOR INSERT WITH CHECK (author_id = public.current_user_id());

-- -------------------------------------------------
-- 15. Audit logs & Reports — write for backend, read for admins
-- -------------------------------------------------
CREATE POLICY "audit_logs_insert_backend"     ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "audit_logs_admin_read"         ON public.audit_logs FOR SELECT  USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "reports_insert_backend"        ON public.reports    FOR INSERT WITH CHECK (true);
CREATE POLICY "reports_admin_read"            ON public.reports    FOR SELECT  USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 16. Past questions, documents, past_question_files — public read, admin/backend write
-- -------------------------------------------------
CREATE POLICY "past_questions_select_all"     ON public.past_questions       FOR SELECT  USING (true);
CREATE POLICY "past_questions_insert_backend" ON public.past_questions       FOR INSERT WITH CHECK (true);
CREATE POLICY "past_questions_update_admin"   ON public.past_questions       FOR UPDATE  USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "past_questions_delete_admin"   ON public.past_questions       FOR DELETE  USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "past_question_files_select_all"    ON public.past_question_files FOR SELECT  USING (true);
CREATE POLICY "past_question_files_insert_backend" ON public.past_question_files FOR INSERT WITH CHECK (true);
CREATE POLICY "past_question_files_update_admin"  ON public.past_question_files FOR UPDATE  USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "past_question_files_delete_admin"  ON public.past_question_files FOR DELETE  USING (public.current_user_role() IN ('admin','super_admin'));

CREATE POLICY "documents_select_all"      ON public.documents  FOR SELECT  USING (true);
CREATE POLICY "documents_insert_backend"  ON public.documents  FOR INSERT WITH CHECK (true);
CREATE POLICY "documents_update_admin"    ON public.documents  FOR UPDATE  USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "documents_delete_admin"    ON public.documents  FOR DELETE  USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 17. Reference / content tables — admin-only read
-- -------------------------------------------------
CREATE POLICY "schools_admin_read"              ON public.schools              FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "school_students_admin_read"      ON public.school_students      FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "school_teachers_admin_read"      ON public.school_teachers      FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "school_classes_admin_read"       ON public.school_classes       FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "teachers_admin_read"             ON public.teachers             FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "teacher_earnings_admin_read"     ON public.teacher_earnings     FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "subjects_admin_read"             ON public.subjects             FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "topics_admin_read"               ON public.topics               FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "subtopics_admin_read"            ON public.subtopics            FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "education_levels_admin_read"     ON public.education_levels     FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "education_systems_admin_read"    ON public.education_systems    FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "programs_admin_read"             ON public.programs             FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "classes_admin_read"              ON public.classes              FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "terms_admin_read"                ON public.terms                FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "roles_admin_read"                ON public.roles                FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "user_roles_admin_read"           ON public.user_roles           FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "badges_admin_read"               ON public.badges               FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "leaderboards_admin_read"         ON public.leaderboards         FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "subscription_plans_admin_read"   ON public.subscription_plans   FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "coupons_admin_read"              ON public.coupons              FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "class_subjects_admin_read"       ON public.class_subjects       FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "course_sections_admin_read"      ON public.course_sections      FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "lesson_resources_admin_read"     ON public.lesson_resources     FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "library_resources_admin_read"    ON public.library_resources    FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "questions_admin_read"            ON public.questions            FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "quizzes_admin_read"              ON public.quizzes              FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "exam_questions_admin_read"       ON public.exam_questions       FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "exams_admin_read"                ON public.exams                FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "quiz_questions_admin_read"       ON public.quiz_questions       FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "live_classes_admin_read"         ON public.live_classes         FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));
CREATE POLICY "system_settings_admin_read"      ON public.system_settings      FOR SELECT USING (public.current_user_role() IN ('admin','super_admin'));

-- -------------------------------------------------
-- 18. Grant schema usage so Supabase client can evaluate RLS
-- -------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
