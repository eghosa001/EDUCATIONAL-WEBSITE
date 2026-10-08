-- Full source-backed past-question expansion workflow.
-- This does not generate or relabel historical past papers. It creates the admin/backend workflow needed
-- to verify raw rows against source documents and promote them only after guarded verification.

create or replace function public.past_question_answer_option_match_count(p_options jsonb, p_answer jsonb)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select count(*)::integer
  from jsonb_array_elements(coalesce(p_options, '[]'::jsonb)) opt(value)
  where lower(trim(coalesce(
    opt.value ->> 'id',
    opt.value ->> 'value',
    opt.value ->> 'label',
    opt.value ->> 'text',
    opt.value #>> '{}'
  ))) = lower(trim(coalesce(
    p_answer ->> 'id',
    p_answer ->> 'value',
    p_answer ->> 'label',
    p_answer ->> 'answer',
    p_answer #>> '{}'
  )));
$$;

revoke all on function public.past_question_answer_option_match_count(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.past_question_answer_option_match_count(jsonb, jsonb) to service_role;

create table if not exists public.past_question_import_batches (
  id uuid primary key default gen_random_uuid(),
  board text not null,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  target_safe_count integer not null default 100 check (target_safe_count between 1 and 1000),
  status text not null default 'planned' check (status in ('planned','in_progress','ready_for_review','blocked','completed','cancelled')),
  priority_rank integer not null default 3,
  source_document_ids uuid[] not null default '{}'::uuid[],
  raw_candidate_count integer not null default 0,
  safe_count_at_creation integer not null default 0,
  deficit_at_creation integer not null default 0,
  next_action text not null default 'inspect_source_material',
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.past_question_import_batches enable row level security;

drop policy if exists past_question_import_batches_service_all on public.past_question_import_batches;
create policy past_question_import_batches_service_all
on public.past_question_import_batches
for all
to service_role
using (true)
with check (true);

create index if not exists past_question_import_batches_board_subject_idx
  on public.past_question_import_batches (lower(board), subject_id, status, priority_rank);
create index if not exists past_question_import_batches_subject_id_idx
  on public.past_question_import_batches (subject_id);

create unique index if not exists past_question_import_batches_one_open_idx
  on public.past_question_import_batches (lower(board), subject_id)
  where status in ('planned','in_progress','ready_for_review','blocked');

create table if not exists public.past_question_answer_verifications (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.past_questions(id) on delete cascade,
  source_document_id uuid references public.documents(id) on delete restrict,
  batch_id uuid references public.past_question_import_batches(id) on delete set null,
  decision text not null check (decision in ('approved','rejected','needs_repair')),
  verification_method text not null default 'source_document_answer_key',
  verified_answer jsonb,
  reviewer_notes text,
  verified_by uuid,
  created_at timestamptz not null default now()
);

alter table public.past_question_answer_verifications enable row level security;

drop policy if exists past_question_answer_verifications_service_all on public.past_question_answer_verifications;
create policy past_question_answer_verifications_service_all
on public.past_question_answer_verifications
for all
to service_role
using (true)
with check (true);

create index if not exists past_question_answer_verifications_question_idx
  on public.past_question_answer_verifications (question_id, created_at desc);
create index if not exists past_question_answer_verifications_batch_idx
  on public.past_question_answer_verifications (batch_id, decision, created_at desc);
create index if not exists past_question_answer_verifications_source_document_idx
  on public.past_question_answer_verifications (source_document_id);

create or replace view public.past_question_source_document_matches
with (security_invoker = true) as
select
  d.id as document_id,
  lower(d.exam_board::text) as board,
  s.id as subject_id,
  s.name as subject_name,
  d.exam_year,
  d.title,
  d.storage_path,
  d.file_url,
  d.is_active,
  count(pq.id) filter (where pq.is_active is true) as active_raw_rows_for_document_year,
  count(pq.id) filter (
    where pq.is_active is true
      and pq.answer_verified_at is null
      and pq.correct_answer is not null
      and jsonb_typeof(pq.options) = 'array'
      and jsonb_array_length(pq.options) >= 2
      and public.past_question_answer_option_match_count(pq.options, pq.correct_answer) = 1
      and length(trim(coalesce(pq.question_text,''))) >= 12
  ) as structurally_verifiable_rows,
  count(pq.id) filter (where pq.answer_verified_at is not null) as already_verified_rows,
  case
    when d.title ~* '(answer|key|solution|marking)' or coalesce(d.storage_path,'') ~* '(answer|key|solution|marking)' then true
    else false
  end as has_answer_key_signal
from public.documents d
left join public.subjects s
  on s.is_active is true
 and lower(regexp_replace(s.name, '\s+', '', 'g')) = lower(regexp_replace(coalesce(d.subject,''), '\s+', '', 'g'))
left join public.past_questions pq
  on lower(pq.board::text) = lower(d.exam_board::text)
 and pq.subject_id = s.id
 and (d.exam_year is null or pq.year is null or pq.year = d.exam_year)
where d.is_active is true
  and d.exam_board is not null
  and d.subject is not null
group by d.id, lower(d.exam_board::text), s.id, s.name, d.exam_year, d.title, d.storage_path, d.file_url, d.is_active;

create or replace view public.past_question_expansion_workflow
with (security_invoker = true) as
with raw as (
  select
    lower(pq.board::text) as board,
    pq.subject_id,
    count(*) filter (where pq.is_active is true) as active_raw_rows,
    count(*) filter (
      where pq.is_active is true
        and pq.answer_verified_at is null
        and pq.correct_answer is not null
        and jsonb_typeof(pq.options) = 'array'
        and jsonb_array_length(pq.options) >= 2
        and public.past_question_answer_option_match_count(pq.options, pq.correct_answer) = 1
        and length(trim(coalesce(pq.question_text,''))) >= 12
    ) as structurally_verifiable_rows,
    count(*) filter (
      where pq.is_active is true
        and (
          pq.correct_answer is null
          or pq.options is null
          or jsonb_typeof(pq.options) <> 'array'
          or jsonb_array_length(pq.options) < 2
          or length(trim(coalesce(pq.question_text,''))) < 12
        )
    ) as rows_needing_structure_repair
  from public.past_questions pq
  group by lower(pq.board::text), pq.subject_id
), docs as (
  select
    board,
    subject_id,
    count(*) filter (where is_active is true) as active_source_documents,
    count(distinct exam_year) filter (where exam_year is not null) as years_with_documents,
    count(*) filter (where has_answer_key_signal) as answer_key_like_documents,
    coalesce(array_agg(document_id order by exam_year desc nulls last, title) filter (where document_id is not null), '{}'::uuid[]) as source_document_ids
  from public.past_question_source_document_matches
  group by board, subject_id
), learner as (
  select
    lower(lpq.board::text) as board,
    lpq.subject_id,
    count(*) filter (where lpq.is_active is true) as learner_safe_count
  from public.learner_past_questions lpq
  group by lower(lpq.board::text), lpq.subject_id
), universe as (
  select distinct board, subject_id from raw
  union
  select distinct board, subject_id from docs
  union
  select distinct board, subject_id from learner
)
select
  u.board,
  u.subject_id,
  s.name as subject_name,
  coalesce(l.learner_safe_count,0)::integer as learner_safe_count,
  100::integer as target_safe_count,
  greatest(100 - coalesce(l.learner_safe_count,0), 0)::integer as deficit_to_9_plus,
  coalesce(r.active_raw_rows,0)::integer as active_raw_rows,
  coalesce(r.structurally_verifiable_rows,0)::integer as structurally_verifiable_rows,
  coalesce(r.rows_needing_structure_repair,0)::integer as rows_needing_structure_repair,
  coalesce(d.active_source_documents,0)::integer as active_source_documents,
  coalesce(d.years_with_documents,0)::integer as years_with_documents,
  coalesce(d.answer_key_like_documents,0)::integer as answer_key_like_documents,
  coalesce(d.source_document_ids,'{}'::uuid[]) as source_document_ids,
  case
    when coalesce(l.learner_safe_count,0) >= 100 then '9+ complete'
    when coalesce(r.structurally_verifiable_rows,0) >= greatest(100 - coalesce(l.learner_safe_count,0), 0)
      and coalesce(d.active_source_documents,0) > 0 then 'verify_raw_answers_against_source_key'
    when coalesce(r.structurally_verifiable_rows,0) > 0 and coalesce(d.active_source_documents,0) > 0 then 'verify_available_then_import_more_source_papers'
    when coalesce(r.active_raw_rows,0) > 0 and coalesce(d.active_source_documents,0) > 0 then 'repair_raw_structure_then_verify_answers'
    when coalesce(r.active_raw_rows,0) > 0 and coalesce(d.active_source_documents,0) = 0 then 'link_source_documents_then_verify_raw_answers'
    else 'import_source_papers_with_answer_keys'
  end as next_action,
  case
    when coalesce(l.learner_safe_count,0) >= 100 then 9
    when coalesce(l.learner_safe_count,0) < 25 and (coalesce(r.active_raw_rows,0) > 0 or coalesce(d.active_source_documents,0) > 0) then 1
    when coalesce(l.learner_safe_count,0) < 50 then 2
    else 3
  end as priority_rank
from universe u
join public.subjects s on s.id = u.subject_id
left join raw r on r.board = u.board and r.subject_id = u.subject_id
left join docs d on d.board = u.board and d.subject_id = u.subject_id
left join learner l on l.board = u.board and l.subject_id = u.subject_id
where u.board in ('jamb','waec','neco','nabteb');

create or replace view public.past_question_verification_package_queue
with (security_invoker = true) as
select
  pq.id as question_id,
  lower(pq.board::text) as board,
  pq.subject_id,
  s.name as subject_name,
  pq.year,
  left(regexp_replace(coalesce(pq.question_text,''), '\s+', ' ', 'g'), 180) as question_preview,
  case when jsonb_typeof(pq.options) = 'array' then jsonb_array_length(pq.options) else 0 end as option_count,
  public.past_question_answer_option_match_count(pq.options, pq.correct_answer) as answer_option_match_count,
  case
    when pq.correct_answer is null then 'missing_answer_key'
    when pq.options is null or jsonb_typeof(pq.options) <> 'array' or jsonb_array_length(pq.options) < 2 then 'bad_options'
    when public.past_question_answer_option_match_count(pq.options, pq.correct_answer) <> 1 then 'answer_not_matching_one_option'
    when length(trim(coalesce(pq.question_text,''))) < 12 then 'short_question_stem'
    when coalesce(d.active_source_documents,0) = 0 then 'missing_source_document_link'
    else 'ready_for_source_key_verification'
  end as queue_status,
  coalesce(d.active_source_documents,0)::integer as matching_source_documents,
  coalesce(d.source_document_ids,'{}'::uuid[]) as source_document_ids,
  pq.created_at,
  pq.updated_at
from public.past_questions pq
join public.subjects s on s.id = pq.subject_id
left join (
  select board, subject_id, count(*) as active_source_documents, array_agg(document_id) as source_document_ids
  from public.past_question_source_document_matches
  where is_active is true
  group by board, subject_id
) d on d.board = lower(pq.board::text) and d.subject_id = pq.subject_id
where pq.is_active is true
  and pq.answer_verified_at is null
  and lower(pq.board::text) in ('jamb','waec','neco','nabteb');

create or replace function public.get_past_question_expansion_system()
returns jsonb
language sql
security invoker
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'summary', (
      select jsonb_build_object(
        'groups_total', count(*),
        'groups_complete_9_plus', count(*) filter (where learner_safe_count >= target_safe_count),
        'groups_needing_work', count(*) filter (where learner_safe_count < target_safe_count),
        'total_learner_safe', coalesce(sum(learner_safe_count),0),
        'total_deficit_to_9_plus', coalesce(sum(deficit_to_9_plus),0),
        'structurally_verifiable_rows', coalesce(sum(structurally_verifiable_rows),0),
        'rows_needing_structure_repair', coalesce(sum(rows_needing_structure_repair),0),
        'source_documents', coalesce(sum(active_source_documents),0)
      ) from public.past_question_expansion_workflow
    ),
    'priority_worklist', (
      select coalesce(jsonb_agg(to_jsonb(w) order by priority_rank, deficit_to_9_plus desc, active_source_documents desc), '[]'::jsonb)
      from (select * from public.past_question_expansion_workflow where deficit_to_9_plus > 0 limit 100) w
    ),
    'verification_queue', (
      select coalesce(jsonb_agg(to_jsonb(q) order by queue_status, updated_at desc), '[]'::jsonb)
      from (select * from public.past_question_verification_package_queue limit 200) q
    )
  );
$$;

revoke all on function public.get_past_question_expansion_system() from public, anon, authenticated;
grant execute on function public.get_past_question_expansion_system() to service_role;

create or replace function public.create_past_question_import_batch(
  p_board text,
  p_subject_id uuid,
  p_target_safe_count integer default 100,
  p_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_work record;
  v_id uuid;
begin
  select * into v_work
  from public.past_question_expansion_workflow
  where board = lower(p_board) and subject_id = p_subject_id;

  if not found then
    raise exception 'No past-question expansion workflow row for board %, subject %', p_board, p_subject_id;
  end if;

  insert into public.past_question_import_batches (
    board, subject_id, target_safe_count, status, priority_rank, source_document_ids,
    raw_candidate_count, safe_count_at_creation, deficit_at_creation, next_action, notes
  ) values (
    v_work.board, v_work.subject_id, p_target_safe_count,
    case when v_work.next_action = '9+ complete' then 'completed' else 'planned' end,
    v_work.priority_rank, v_work.source_document_ids,
    v_work.structurally_verifiable_rows, v_work.learner_safe_count, v_work.deficit_to_9_plus,
    v_work.next_action, p_notes
  )
  on conflict (lower(board), subject_id) where status in ('planned','in_progress','ready_for_review','blocked')
  do update set
    target_safe_count = excluded.target_safe_count,
    priority_rank = excluded.priority_rank,
    source_document_ids = excluded.source_document_ids,
    raw_candidate_count = excluded.raw_candidate_count,
    safe_count_at_creation = excluded.safe_count_at_creation,
    deficit_at_creation = excluded.deficit_at_creation,
    next_action = excluded.next_action,
    notes = coalesce(excluded.notes, public.past_question_import_batches.notes),
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.create_past_question_import_batch(text, uuid, integer, text) from public, anon, authenticated;
grant execute on function public.create_past_question_import_batch(text, uuid, integer, text) to service_role;

create or replace function public.record_past_question_answer_verification(
  p_question_id uuid,
  p_source_document_id uuid,
  p_decision text,
  p_verified_answer jsonb default null,
  p_reviewer_notes text default null,
  p_batch_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_q record;
  v_d record;
  v_answer jsonb;
  v_match_count integer;
  v_event_id uuid;
begin
  if p_decision not in ('approved','rejected','needs_repair') then
    raise exception 'Invalid verification decision: %', p_decision;
  end if;

  select pq.*, s.name as subject_name into v_q
  from public.past_questions pq
  left join public.subjects s on s.id = pq.subject_id
  where pq.id = p_question_id;

  if not found then
    raise exception 'Question not found: %', p_question_id;
  end if;

  if p_source_document_id is not null then
    select * into v_d from public.documents where id = p_source_document_id;
    if not found then
      raise exception 'Source document not found: %', p_source_document_id;
    end if;
  end if;

  if p_decision = 'approved' then
    if p_source_document_id is null then raise exception 'Approving a past question requires a source document id'; end if;
    if coalesce(v_d.is_active, false) is not true then raise exception 'Source document is not active'; end if;
    if lower(coalesce(v_d.exam_board,'')) <> lower(coalesce(v_q.board,'')) then raise exception 'Source document board does not match question board'; end if;
    if v_d.subject is not null and v_q.subject_name is not null
       and lower(regexp_replace(v_d.subject, '\s+', '', 'g')) <> lower(regexp_replace(v_q.subject_name, '\s+', '', 'g')) then
      raise exception 'Source document subject does not match question subject';
    end if;
    if v_d.exam_year is not null and v_q.year is not null and v_d.exam_year <> v_q.year then
      raise exception 'Source document year does not match question year';
    end if;

    v_answer := coalesce(p_verified_answer, v_q.correct_answer);
    if v_answer is null then raise exception 'Approved verification requires a correct answer'; end if;
    if coalesce(v_q.is_active, false) is not true then raise exception 'Question is not active'; end if;
    if length(trim(coalesce(v_q.question_text,''))) < 12 then raise exception 'Question stem is too short for learner-safe promotion'; end if;
    if jsonb_typeof(v_q.options) <> 'array' or jsonb_array_length(v_q.options) < 2 then raise exception 'Question options are not scoreable'; end if;

    v_match_count := public.past_question_answer_option_match_count(v_q.options, v_answer);
    if v_match_count <> 1 then raise exception 'Verified answer must match exactly one option; matches=%', v_match_count; end if;

    update public.past_questions
    set correct_answer = v_answer,
        answer_source = 'source-pdf-answer-key',
        answer_verified_at = coalesce(answer_verified_at, now()),
        updated_at = now()
    where id = p_question_id;
  end if;

  insert into public.past_question_answer_verifications (
    question_id, source_document_id, batch_id, decision, verified_answer, reviewer_notes
  ) values (
    p_question_id, p_source_document_id, p_batch_id, p_decision,
    case when p_decision = 'approved' then coalesce(p_verified_answer, v_q.correct_answer) else null end,
    p_reviewer_notes
  ) returning id into v_event_id;

  if p_batch_id is not null then
    update public.past_question_import_batches
    set status = case when status = 'planned' then 'in_progress' else status end,
        updated_at = now()
    where id = p_batch_id;
  end if;

  return jsonb_build_object(
    'verification_event_id', v_event_id,
    'question_id', p_question_id,
    'decision', p_decision,
    'promoted_to_learner_safe', p_decision = 'approved'
  );
end;
$$;

revoke all on function public.record_past_question_answer_verification(uuid, uuid, text, jsonb, text, uuid) from public, anon, authenticated;
grant execute on function public.record_past_question_answer_verification(uuid, uuid, text, jsonb, text, uuid) to service_role;

insert into public.past_question_import_batches (
  board, subject_id, target_safe_count, status, priority_rank, source_document_ids,
  raw_candidate_count, safe_count_at_creation, deficit_at_creation, next_action, notes
)
select
  board, subject_id, target_safe_count,
  case when next_action = '9+ complete' then 'completed' else 'planned' end,
  priority_rank, source_document_ids, structurally_verifiable_rows,
  learner_safe_count, deficit_to_9_plus, next_action,
  'Auto-seeded by past_question_expansion_workflow_v1'
from public.past_question_expansion_workflow
where deficit_to_9_plus > 0
on conflict (lower(board), subject_id) where status in ('planned','in_progress','ready_for_review','blocked')
do update set
  priority_rank = excluded.priority_rank,
  source_document_ids = excluded.source_document_ids,
  raw_candidate_count = excluded.raw_candidate_count,
  safe_count_at_creation = excluded.safe_count_at_creation,
  deficit_at_creation = excluded.deficit_at_creation,
  next_action = excluded.next_action,
  updated_at = now();

revoke all on function public.get_past_question_import_backlog() from public, anon, authenticated;
grant execute on function public.get_past_question_import_backlog() to service_role;
revoke all on table public.past_question_import_batches from anon, authenticated;
revoke all on table public.past_question_answer_verifications from anon, authenticated;
revoke all on table public.past_question_source_document_matches from anon, authenticated;
revoke all on table public.past_question_expansion_workflow from anon, authenticated;
revoke all on table public.past_question_verification_package_queue from anon, authenticated;
grant select, insert, update on public.past_question_import_batches to service_role;
grant select, insert on public.past_question_answer_verifications to service_role;
grant select on public.past_question_source_document_matches to service_role;
grant select on public.past_question_expansion_workflow to service_role;
grant select on public.past_question_verification_package_queue to service_role;
