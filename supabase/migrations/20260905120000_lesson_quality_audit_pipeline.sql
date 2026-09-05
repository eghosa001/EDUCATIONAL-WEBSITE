create table if not exists public.lesson_quality_audits (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','passed','failed','repaired','repair_failed')),
  score integer check (score is null or (score >= 0 and score <= 100)),
  issues jsonb not null default '[]'::jsonb,
  deterministic_flags jsonb not null default '[]'::jsonb,
  original_content_hash text,
  original_content text,
  corrected_content text,
  model text,
  audit_version integer not null default 1,
  attempt_count integer not null default 0,
  error_message text,
  audited_at timestamptz,
  repaired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id)
);

create index if not exists idx_lesson_quality_audits_status on public.lesson_quality_audits(status);
create index if not exists idx_lesson_quality_audits_updated_at on public.lesson_quality_audits(updated_at);

alter table public.lesson_quality_audits enable row level security;

create or replace function public.claim_lesson_quality_audits(p_limit integer default 5)
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
      and (a.id is null or a.status in ('pending','repair_failed'))
    order by l.id
    for update of l skip locked
    limit greatest(1, least(coalesce(p_limit, 5), 10))
  ), inserted as (
    insert into public.lesson_quality_audits (lesson_id, status, attempt_count, updated_at)
    select id, 'processing', 1, now() from candidates
    on conflict (lesson_id) do update
      set status = 'processing',
          attempt_count = public.lesson_quality_audits.attempt_count + 1,
          error_message = null,
          updated_at = now()
      where public.lesson_quality_audits.status in ('pending','repair_failed')
    returning lesson_quality_audits.lesson_id
  )
  select inserted.lesson_id from inserted;
end;
$$;

revoke all on function public.claim_lesson_quality_audits(integer) from public;
grant execute on function public.claim_lesson_quality_audits(integer) to service_role;

create or replace function public.set_lesson_quality_audit_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lesson_quality_audits_updated_at on public.lesson_quality_audits;
create trigger trg_lesson_quality_audits_updated_at
before update on public.lesson_quality_audits
for each row execute function public.set_lesson_quality_audit_updated_at();
