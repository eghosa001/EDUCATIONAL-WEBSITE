create or replace function public.claim_lesson_quality_audits(p_limit integer default 5, p_include_failed boolean default false)
returns table (lesson_id uuid)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with candidates as (
    select l.id
    from public.lessons l
    left join public.lesson_quality_audits a on a.lesson_id = l.id
    where l.course_id is not null
      and l.topic_id is not null
      and coalesce(length(trim(l.written_content)), 0) > 0
      and (
        a.id is null
        or a.status in ('pending','repair_failed')
        or (p_include_failed and a.status = 'failed')
      )
    order by l.id
    for update of l skip locked
    limit greatest(1, least(coalesce(p_limit, 5), 10))
  ), claimed as (
    insert into public.lesson_quality_audits (lesson_id, status, attempt_count, updated_at)
    select id, 'processing', 1, now() from candidates
    on conflict (lesson_id) do update
      set status = 'processing',
          attempt_count = public.lesson_quality_audits.attempt_count + 1,
          error_message = null,
          updated_at = now()
      where public.lesson_quality_audits.status in ('pending','repair_failed')
         or (p_include_failed and public.lesson_quality_audits.status = 'failed')
    returning lesson_quality_audits.lesson_id
  )
  select claimed.lesson_id from claimed;
end;
$$;

revoke all on function public.claim_lesson_quality_audits(integer) from public;
revoke all on function public.claim_lesson_quality_audits(integer, boolean) from public;
grant execute on function public.claim_lesson_quality_audits(integer, boolean) to service_role;
