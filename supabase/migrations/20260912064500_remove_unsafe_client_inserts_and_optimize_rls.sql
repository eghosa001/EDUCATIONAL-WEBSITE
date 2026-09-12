drop policy if exists notifications_insert_any on public.notifications;
drop policy if exists wallets_insert_own on public.wallets;
drop policy if exists wallet_transactions_insert_own on public.wallet_transactions;
drop policy if exists payments_insert_own on public.payments;

alter policy student_courses_select_own on public.student_courses using (student_id = (select auth.uid()));
alter policy student_courses_insert_own on public.student_courses with check (student_id = (select auth.uid()));
alter policy student_courses_delete_own on public.student_courses using (student_id = (select auth.uid()));

alter policy ai_conversations_select_own on public.ai_conversations using (user_id = (select auth.uid()));
alter policy ai_conversations_insert_own on public.ai_conversations with check (user_id = (select auth.uid()));
alter policy ai_conversations_delete_own on public.ai_conversations using (user_id = (select auth.uid()));

alter policy ai_messages_select_own on public.ai_messages using (
  exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and c.user_id = (select auth.uid())
  )
);
alter policy ai_messages_insert_own on public.ai_messages with check (
  exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id
      and c.user_id = (select auth.uid())
  )
);

alter policy ai_usage_select_own on public.ai_usage using (user_id = (select auth.uid()));
alter policy flashcard_reviews_select_own on public.flashcard_reviews using (user_id = (select auth.uid()));
alter policy flashcards_select_own on public.flashcards using (created_by = (select auth.uid()));
alter policy notifications_select_own on public.notifications using (user_id = (select auth.uid()));
alter policy notifications_update_own on public.notifications using (user_id = (select auth.uid()));
alter policy payments_select_own on public.payments using (user_id = (select auth.uid()));
alter policy subscriptions_select_own on public.subscriptions using (user_id = (select auth.uid()));
alter policy wallet_transactions_select_own on public.wallet_transactions using (user_id = (select auth.uid()));
alter policy wallets_select_own on public.wallets using (user_id = (select auth.uid()));

alter policy community_posts_insert_own on public.community_posts with check (user_id = (select auth.uid()));
alter policy community_posts_update_own on public.community_posts using (user_id = (select auth.uid()));
alter policy community_posts_delete_own on public.community_posts using (user_id = (select auth.uid()));
alter policy comments_insert_own on public.comments with check (user_id = (select auth.uid()));
alter policy post_likes_insert_own on public.post_likes with check (user_id = (select auth.uid()));
alter policy comment_likes_insert_own on public.comment_likes with check (user_id = (select auth.uid()));
