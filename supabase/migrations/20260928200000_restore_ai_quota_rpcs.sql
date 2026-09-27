-- Restore the quota RPCs used by the AI tutor and flashcard edge functions.
-- These functions are service-role only so browser clients cannot manipulate quota counters.

create or replace function public.consume_ai_request(
  p_user_id uuid,
  p_daily_limit integer default 100
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  consumed boolean;
begin
  if p_user_id is null then return false; end if;
  if coalesce(p_daily_limit, 0) < 1 then return false; end if;

  insert into public.ai_usage
    (user_id, date, questions_asked, tokens_used, conversations_started)
  values
    (p_user_id, current_date, 1, 0, 0)
  on conflict (user_id, date) do update
    set questions_asked = public.ai_usage.questions_asked + 1
    where public.ai_usage.questions_asked < p_daily_limit
  returning true into consumed;

  return coalesce(consumed, false);
end;
$$;

create or replace function public.release_ai_request(p_user_id uuid)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.ai_usage
  set questions_asked = greatest(0, coalesce(questions_asked, 0) - 1)
  where user_id = p_user_id
    and date = current_date;
$$;

revoke all on function public.consume_ai_request(uuid, integer) from public, anon, authenticated;
revoke all on function public.release_ai_request(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_request(uuid, integer) to service_role;
grant execute on function public.release_ai_request(uuid) to service_role;
