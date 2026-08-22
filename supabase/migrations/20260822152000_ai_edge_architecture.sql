-- AI data owned by Supabase instead of the legacy Express backend.
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null,
  input_tokens integer,
  output_tokens integer,
  created_at timestamptz not null default now()
);

create index if not exists ai_conversations_user_id_idx on public.ai_conversations(user_id, updated_at desc);
create index if not exists ai_messages_conversation_id_idx on public.ai_messages(conversation_id, created_at);
create index if not exists ai_usage_events_user_id_idx on public.ai_usage_events(user_id, created_at desc);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage_events enable row level security;

drop policy if exists "Users can read own AI conversations" on public.ai_conversations;
create policy "Users can read own AI conversations"
on public.ai_conversations for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own AI conversations" on public.ai_conversations;
create policy "Users can create own AI conversations"
on public.ai_conversations for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own AI conversations" on public.ai_conversations;
create policy "Users can update own AI conversations"
on public.ai_conversations for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users can delete own AI conversations" on public.ai_conversations;
create policy "Users can delete own AI conversations"
on public.ai_conversations for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can read own AI messages" on public.ai_messages;
create policy "Users can read own AI messages"
on public.ai_messages for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create own AI messages" on public.ai_messages;
create policy "Users can create own AI messages"
on public.ai_messages for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can read own AI usage" on public.ai_usage_events;
create policy "Users can read own AI usage"
on public.ai_usage_events for select to authenticated
using (user_id = auth.uid());

create or replace function public.touch_ai_conversation()
returns trigger
language plpgsql
security invoker
as $$
begin
  update public.ai_conversations set updated_at = now() where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists ai_message_touch_conversation on public.ai_messages;
create trigger ai_message_touch_conversation
after insert on public.ai_messages
for each row execute function public.touch_ai_conversation();
