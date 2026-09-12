drop policy if exists ai_conversations_admin_read on public.ai_conversations;
create policy ai_conversations_admin_read on public.ai_conversations for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists ai_messages_admin_read on public.ai_messages;
create policy ai_messages_admin_read on public.ai_messages for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists ai_usage_admin_read on public.ai_usage;
create policy ai_usage_admin_read on public.ai_usage for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists flashcard_reviews_admin_read on public.flashcard_reviews;
create policy flashcard_reviews_admin_read on public.flashcard_reviews for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists flashcards_admin_read on public.flashcards;
create policy flashcards_admin_read on public.flashcards for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists notifications_admin_read on public.notifications;
create policy notifications_admin_read on public.notifications for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists payments_admin_read on public.payments;
create policy payments_admin_read on public.payments for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists subscriptions_admin_read on public.subscriptions;
create policy subscriptions_admin_read on public.subscriptions for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists wallet_transactions_admin_read on public.wallet_transactions;
create policy wallet_transactions_admin_read on public.wallet_transactions for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists wallets_admin_read on public.wallets;
create policy wallets_admin_read on public.wallets for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));

drop policy if exists student_courses_admin_read on public.student_courses;
create policy student_courses_admin_read on public.student_courses for select to authenticated using (has_role('admin'::text) or has_role('super_admin'::text));
