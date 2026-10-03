-- Atomically save JAMB CBT answers only while the server-side timer is active.
create or replace function public.save_jamb_cbt_answer(
  p_session_id uuid,
  p_user_id uuid,
  p_question_id text,
  p_answer text
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  updated_count integer;
begin
  if p_answer !~ '^[A-E]$' then
    return false;
  end if;

  update public.jamb_cbt_sessions s
  set answers = coalesce(s.answers, '{}'::jsonb) || jsonb_build_object(p_question_id, p_answer)
  where s.id = p_session_id
    and s.user_id = p_user_id
    and s.status = 'active'
    and s.expires_at > now()
    and exists (
      select 1
      from jsonb_array_elements(s.questions) q
      where q->>'id' = p_question_id
        and exists (
          select 1
          from jsonb_array_elements(q->'options') opt
          where upper(coalesce(opt->>'id','')) = p_answer
        )
    );

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke execute on function public.save_jamb_cbt_answer(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.save_jamb_cbt_answer(uuid,uuid,text,text) to service_role;
