begin;

create or replace function public.consume_password_reset(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  update public.password_resets
     set used_at = now()
   where token_hash = p_token_hash
     and expires_at > now()
     and used_at is null
  returning user_id into v_user_id;

  return v_user_id;
end;
$$;

revoke all on function public.consume_password_reset(text) from public, anon, authenticated;
grant execute on function public.consume_password_reset(text) to service_role;

commit;
