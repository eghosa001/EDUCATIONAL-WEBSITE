-- Fix RLS policies to work with Supabase Auth (auth.uid / auth.jwt)
-- Replace current_user_id() and current_user_role() helpers that depend on JWT claims

-- 1. Drop the old helper functions
DROP FUNCTION IF EXISTS public.current_user_id();
DROP FUNCTION IF EXISTS public.current_user_role();

-- 2. Update users table policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_admin_read" ON public.users;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_admin_read" ON public.users FOR SELECT USING (
  auth.uid() IS NOT NULL
  OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

-- 3. Update user_roles policies
DROP POLICY IF EXISTS "user_roles_admin_read" ON public.user_roles;
CREATE POLICY "user_roles_admin_read" ON public.user_roles FOR SELECT USING (
  auth.uid() IS NOT NULL
  OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

-- 4. Update roles policies
DROP POLICY IF EXISTS "roles_admin_read" ON public.roles;
CREATE POLICY "roles_admin_read" ON public.roles FOR SELECT USING (
  auth.uid() IS NOT NULL
  OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text])
);

-- 5. Update ALL remaining policies that reference current_user_id() or current_user_role()
-- This uses pg_get_expr to find and update them dynamically

-- Helper: rebuild policies that use current_user_id() to use auth.uid()
DO $$
DECLARE
  rec RECORD;
  new_policy_def text;
BEGIN
  -- Update policies on tables that use current_user_id()
  FOR rec IN
    SELECT pol.polname, pol.polrelid, pol.polqual, cl.relname
    FROM pg_policy pol
    JOIN pg_class cl ON pol.polrelid = cl.oid
    WHERE pol.polqual IS NOT NULL
      AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%current_user_id()%'
      AND cl.relnamespace = 'public'::regnamespace
  LOOP
    new_policy_def := replace(pg_get_expr(rec.polqual, rec.polrelid), 'current_user_id()', 'auth.uid()');
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', rec.polname, rec.relname);
    -- Re-create with updated definition using ALTER ... ADD POLICY is complex,
    -- so we store the new def for manual review or re-apply from migration
    RAISE NOTICE 'Would update policy % on % to: %', rec.polname, rec.relname, new_policy_def;
  END LOOP;

  FOR rec IN
    SELECT pol.polname, pol.polrelid, pol.polqual, cl.relname
    FROM pg_policy pol
    JOIN pg_class cl ON pol.polrelid = cl.oid
    WHERE pol.polqual IS NOT NULL
      AND pg_get_expr(pol.polqual, pol.polrelid) LIKE '%current_user_role()%'
      AND cl.relnamespace = 'public'::regnamespace
  LOOP
    new_policy_def := replace(pg_get_expr(rec.polqual, rec.polrelid), 'current_user_role()', '(auth.jwt() ->> ''role''::text)');
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', rec.polname, rec.relname);
    RAISE NOTICE 'Would update policy % on % to: %', rec.polname, rec.relname, new_policy_def;
  END LOOP;
END $$;

-- 6. Recreate all affected policies properly
-- Pattern: current_user_id() -> auth.uid(), current_user_role() -> (auth.jwt() ->> 'role')

-- lessons
DROP POLICY IF EXISTS "lesson_progress_select_own" ON public.lesson_progress;
CREATE POLICY "lesson_progress_select_own" ON public.lesson_progress FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS "lesson_progress_upsert_own" ON public.lesson_progress;
CREATE POLICY "lesson_progress_upsert_own" ON public.lesson_progress FOR ALL USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "lesson_progress_admin_read" ON public.lesson_progress;
CREATE POLICY "lesson_progress_admin_read" ON public.lesson_progress FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- study_sessions
DROP POLICY IF EXISTS "study_sessions_select_own" ON public.study_sessions;
CREATE POLICY "study_sessions_select_own" ON public.study_sessions FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS "study_sessions_insert_own" ON public.study_sessions;
CREATE POLICY "study_sessions_insert_own" ON public.study_sessions FOR INSERT WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "study_sessions_update_own" ON public.study_sessions;
CREATE POLICY "study_sessions_update_own" ON public.study_sessions FOR UPDATE USING (student_id = auth.uid());
DROP POLICY IF EXISTS "study_sessions_admin_read" ON public.study_sessions;
CREATE POLICY "study_sessions_admin_read" ON public.study_sessions FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- student_courses
DROP POLICY IF EXISTS "student_courses_select_own" ON public.student_courses;
CREATE POLICY "student_courses_select_own" ON public.student_courses FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS "student_courses_insert_own" ON public.student_courses;
CREATE POLICY "student_courses_insert_own" ON public.student_courses FOR INSERT WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "student_courses_admin_read" ON public.student_courses;
CREATE POLICY "student_courses_admin_read" ON public.student_courses FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- quiz_attempts
DROP POLICY IF EXISTS "quiz_attempts_select_own" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_select_own" ON public.quiz_attempts FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS "quiz_attempts_insert_own" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_insert_own" ON public.quiz_attempts FOR INSERT WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "quiz_attempts_admin_read" ON public.quiz_attempts;
CREATE POLICY "quiz_attempts_admin_read" ON public.quiz_attempts FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- exam_attempts
DROP POLICY IF EXISTS "exam_attempts_select_own" ON public.exam_attempts;
CREATE POLICY "exam_attempts_select_own" ON public.exam_attempts FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS "exam_attempts_insert_own" ON public.exam_attempts;
CREATE POLICY "exam_attempts_insert_own" ON public.exam_attempts FOR INSERT WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "exam_attempts_admin_read" ON public.exam_attempts;
CREATE POLICY "exam_attempts_admin_read" ON public.exam_attempts FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- exam_answers
DROP POLICY IF EXISTS "exam_answers_select_own" ON public.exam_answers;
CREATE POLICY "exam_answers_select_own" ON public.exam_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.exam_attempts e WHERE e.id = exam_answers.attempt_id AND e.student_id = auth.uid())
);
DROP POLICY IF EXISTS "exam_answers_admin_read" ON public.exam_answers;
CREATE POLICY "exam_answers_admin_read" ON public.exam_answers FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- submissions
DROP POLICY IF EXISTS "submissions_select_own" ON public.submissions;
CREATE POLICY "submissions_select_own" ON public.submissions FOR SELECT USING (student_id = auth.uid());
DROP POLICY IF EXISTS "submissions_insert_own" ON public.submissions;
CREATE POLICY "submissions_insert_own" ON public.submissions FOR INSERT WITH CHECK (student_id = auth.uid());
DROP POLICY IF EXISTS "submissions_admin_read" ON public.submissions;
CREATE POLICY "submissions_admin_read" ON public.submissions FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- assignments
DROP POLICY IF EXISTS "assignments_admin_read" ON public.assignments;
CREATE POLICY "assignments_admin_read" ON public.assignments FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- gamification (user_id column)
DROP POLICY IF EXISTS "student_points_select_own" ON public.student_points;
CREATE POLICY "student_points_select_own" ON public.student_points FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "points_history_select_own" ON public.points_history;
CREATE POLICY "points_history_select_own" ON public.points_history FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "points_history_insert_own" ON public.points_history;
CREATE POLICY "points_history_insert_own" ON public.points_history FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "achievements_select_own" ON public.achievements;
CREATE POLICY "achievements_select_own" ON public.achievements FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "user_rewards_select_own" ON public.user_rewards;
CREATE POLICY "user_rewards_select_own" ON public.user_rewards FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "student_points_admin_read" ON public.student_points;
CREATE POLICY "student_points_admin_read" ON public.student_points FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "points_history_admin_read" ON public.points_history;
CREATE POLICY "points_history_admin_read" ON public.points_history FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "achievements_admin_read" ON public.achievements;
CREATE POLICY "achievements_admin_read" ON public.achievements FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "rewards_admin_read" ON public.rewards;
CREATE POLICY "rewards_admin_read" ON public.rewards FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "user_rewards_admin_read" ON public.user_rewards;
CREATE POLICY "user_rewards_admin_read" ON public.user_rewards FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- AI
DROP POLICY IF EXISTS "ai_conversations_select_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_select_own" ON public.ai_conversations FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ai_conversations_insert_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_insert_own" ON public.ai_conversations FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "ai_conversations_delete_own" ON public.ai_conversations;
CREATE POLICY "ai_conversations_delete_own" ON public.ai_conversations FOR DELETE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ai_conversations_admin_read" ON public.ai_conversations;
CREATE POLICY "ai_conversations_admin_read" ON public.ai_conversations FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

DROP POLICY IF EXISTS "ai_messages_select_own" ON public.ai_messages;
CREATE POLICY "ai_messages_select_own" ON public.ai_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "ai_messages_insert_own" ON public.ai_messages;
CREATE POLICY "ai_messages_insert_own" ON public.ai_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.ai_conversations c WHERE c.id = ai_messages.conversation_id AND c.user_id = auth.uid())
);
DROP POLICY IF EXISTS "ai_messages_admin_read" ON public.ai_messages;
CREATE POLICY "ai_messages_admin_read" ON public.ai_messages FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

DROP POLICY IF EXISTS "ai_usage_select_own" ON public.ai_usage;
CREATE POLICY "ai_usage_select_own" ON public.ai_usage FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "ai_usage_admin_read" ON public.ai_usage;
CREATE POLICY "ai_usage_admin_read" ON public.ai_usage FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- notifications
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "notifications_admin_read" ON public.notifications;
CREATE POLICY "notifications_admin_read" ON public.notifications FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- flashcards
DROP POLICY IF EXISTS "flashcards_select_own" ON public.flashcards;
CREATE POLICY "flashcards_select_own" ON public.flashcards FOR SELECT USING (created_by = auth.uid());
DROP POLICY IF EXISTS "flashcard_reviews_select_own" ON public.flashcard_reviews;
CREATE POLICY "flashcard_reviews_select_own" ON public.flashcard_reviews FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "flashcards_admin_read" ON public.flashcards;
CREATE POLICY "flashcards_admin_read" ON public.flashcards FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "flashcard_reviews_admin_read" ON public.flashcard_reviews;
CREATE POLICY "flashcard_reviews_admin_read" ON public.flashcard_reviews FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- wallet & payments
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "wallets_insert_own" ON public.wallets;
CREATE POLICY "wallets_insert_own" ON public.wallets FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "wallet_transactions_select_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_select_own" ON public.wallet_transactions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "wallet_transactions_insert_own" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_insert_own" ON public.wallet_transactions FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;
CREATE POLICY "transactions_select_own" ON public.transactions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
CREATE POLICY "invoices_select_own" ON public.invoices FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "subscriptions_select_own" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "payment_methods_select_own" ON public.payment_methods;
CREATE POLICY "payment_methods_select_own" ON public.payment_methods FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "coupon_usages_select_own" ON public.coupon_usages;
CREATE POLICY "coupon_usages_select_own" ON public.coupon_usages FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "wallets_admin_read" ON public.wallets;
CREATE POLICY "wallets_admin_read" ON public.wallets FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "wallet_transactions_admin_read" ON public.wallet_transactions;
CREATE POLICY "wallet_transactions_admin_read" ON public.wallet_transactions FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "payments_admin_read" ON public.payments;
CREATE POLICY "payments_admin_read" ON public.payments FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "transactions_admin_read" ON public.transactions;
CREATE POLICY "transactions_admin_read" ON public.transactions FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "invoices_admin_read" ON public.invoices;
CREATE POLICY "invoices_admin_read" ON public.invoices FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "subscriptions_admin_read" ON public.subscriptions;
CREATE POLICY "subscriptions_admin_read" ON public.subscriptions FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "payment_methods_admin_read" ON public.payment_methods;
CREATE POLICY "payment_methods_admin_read" ON public.payment_methods FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "coupon_usages_admin_read" ON public.coupon_usages;
CREATE POLICY "coupon_usages_admin_read" ON public.coupon_usages FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- parents
DROP POLICY IF EXISTS "parents_select_own" ON public.parents;
CREATE POLICY "parents_select_own" ON public.parents FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "parent_children_select_own" ON public.parent_children;
CREATE POLICY "parent_children_select_own" ON public.parent_children FOR SELECT USING (parent_id = auth.uid());
DROP POLICY IF EXISTS "parent_children_child_read" ON public.parent_children;
CREATE POLICY "parent_children_child_read" ON public.parent_children FOR SELECT USING (child_user_id = auth.uid());
DROP POLICY IF EXISTS "parents_admin_read" ON public.parents;
CREATE POLICY "parents_admin_read" ON public.parents FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "parent_children_admin_read" ON public.parent_children;
CREATE POLICY "parent_children_admin_read" ON public.parent_children FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- community
DROP POLICY IF EXISTS "comments_insert_own" ON public.comments;
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "comment_likes_insert_own" ON public.comment_likes;
CREATE POLICY "comment_likes_insert_own" ON public.comment_likes FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "community_posts_insert_own" ON public.community_posts;
CREATE POLICY "community_posts_insert_own" ON public.community_posts FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "community_posts_update_own" ON public.community_posts;
CREATE POLICY "community_posts_update_own" ON public.community_posts FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "community_posts_delete_own" ON public.community_posts;
CREATE POLICY "community_posts_delete_own" ON public.community_posts FOR DELETE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "post_likes_insert_own" ON public.post_likes;
CREATE POLICY "post_likes_insert_own" ON public.post_likes FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "forum_members_insert_own" ON public.forum_members;
CREATE POLICY "forum_members_insert_own" ON public.forum_members FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "study_group_members_insert_own" ON public.study_group_members;
CREATE POLICY "study_group_members_insert_own" ON public.study_group_members FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "study_group_messages_insert_own" ON public.study_group_messages;
CREATE POLICY "study_group_messages_insert_own" ON public.study_group_messages FOR INSERT WITH CHECK (author_id = auth.uid());

-- audit_logs & reports
DROP POLICY IF EXISTS "audit_logs_admin_read" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read" ON public.audit_logs FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "reports_admin_read" ON public.reports;
CREATE POLICY "reports_admin_read" ON public.reports FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- past_questions, documents, past_question_files
DROP POLICY IF EXISTS "past_questions_admin_read" ON public.past_questions;
CREATE POLICY "past_questions_admin_read" ON public.past_questions FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "past_questions_update_admin" ON public.past_questions;
CREATE POLICY "past_questions_update_admin" ON public.past_questions FOR UPDATE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "past_questions_delete_admin" ON public.past_questions;
CREATE POLICY "past_questions_delete_admin" ON public.past_questions FOR DELETE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

DROP POLICY IF EXISTS "past_question_files_update_admin" ON public.past_question_files;
CREATE POLICY "past_question_files_update_admin" ON public.past_question_files FOR UPDATE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "past_question_files_delete_admin" ON public.past_question_files;
CREATE POLICY "past_question_files_delete_admin" ON public.past_question_files FOR DELETE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

DROP POLICY IF EXISTS "documents_admin_read" ON public.documents;
CREATE POLICY "documents_admin_read" ON public.documents FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "documents_update_admin" ON public.documents;
CREATE POLICY "documents_update_admin" ON public.documents FOR UPDATE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "documents_delete_admin" ON public.documents;
CREATE POLICY "documents_delete_admin" ON public.documents FOR DELETE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Reference/content tables — admin read
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename IN (
        'schools','school_students','school_teachers','school_classes',
        'teachers','teacher_earnings','subjects','topics','subtopics',
        'education_levels','education_systems','programs','classes','terms',
        'roles','user_roles','badges','leaderboards','subscription_plans',
        'coupons','class_subjects','course_sections','lesson_resources',
        'library_resources','questions','quizzes','exam_questions','exams',
        'quiz_questions','live_classes','system_settings'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_admin_read ON public.%I', rec.tablename, rec.tablename);
    EXECUTE format(
      'CREATE POLICY %I_admin_read ON public.%I FOR SELECT USING (auth.uid() IS NOT NULL OR (auth.jwt() ->> ''role''::text) = ANY (ARRAY[''admin''::text, ''super_admin''::text]))',
      rec.tablename, rec.tablename
    );
  END LOOP;
END $$;

-- courses & lessons admin policies
DROP POLICY IF EXISTS "courses_insert_admin" ON public.courses;
CREATE POLICY "courses_insert_admin" ON public.courses FOR INSERT WITH CHECK ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "courses_update_admin" ON public.courses;
CREATE POLICY "courses_update_admin" ON public.courses FOR UPDATE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "courses_delete_admin" ON public.courses;
CREATE POLICY "courses_delete_admin" ON public.courses FOR DELETE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));

DROP POLICY IF EXISTS "lessons_insert_admin" ON public.lessons;
CREATE POLICY "lessons_insert_admin" ON public.lessons FOR INSERT WITH CHECK ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "lessons_update_admin" ON public.lessons;
CREATE POLICY "lessons_update_admin" ON public.lessons FOR UPDATE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
DROP POLICY IF EXISTS "lessons_delete_admin" ON public.lessons;
CREATE POLICY "lessons_delete_admin" ON public.lessons FOR DELETE USING ((auth.jwt() ->> 'role'::text) = ANY (ARRAY['admin'::text, 'super_admin'::text]));
