-- AI Edge Function migration: the base AI conversation/message tables already exist
-- in the remote schema. Keep this migration idempotent and only add supporting indexes.
create index if not exists ai_conversations_user_updated_idx
  on public.ai_conversations(user_id, updated_at desc);

create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages(conversation_id, created_at);

-- Existing RLS policies already bind messages to their owning conversation.
