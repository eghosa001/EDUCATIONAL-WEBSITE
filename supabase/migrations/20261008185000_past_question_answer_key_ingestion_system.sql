-- Source-backed answer-key ingestion for historical past-question expansion.
-- This adds the missing bulk-verification layer; it does not fabricate or relabel generated practice as past papers.

create table if not exists public.past_question_answer_key_imports (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid references public.past_question_import_batches(id) on delete set null,
  source_document_id uuid references public.documents(id) on delete restrict,
  board text not null,
  subject_id uuid references public.subjects(id) on delete restrict,
  exam_year integer,
  source_label text not null,
  status text not null default 'staged' check (status in ('staged','partially_applied','applied','rejected')),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  notes text
);

create table if not exists public.past_question_answer_key_import_items (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.past_question_answer_key_imports(id) on delete cascade,
  past_question_id uuid not null references public.past_questions(id) on delete cascade,
  answer_key text not null check (upper(answer_key) in ('A','B','C','D','E')),
  source_excerpt text,
  status text not null default 'staged' check (status in ('staged','applied','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  unique(import_id, past_question_id)
);

alter table public.past_question_answer_key_imports enable row level security;
alter table public.past_question_answer_key_import_items enable row level security;

drop policy if exists past_question_answer_key_imports_no_client_access on public.past_question_answer_key_imports;
create policy past_question_answer_key_imports_no_client_access
on public.past_question_answer_key_imports
for all to anon, authenticated
using (false)
with check (false);

drop policy if exists past_question_answer_key_import_items_no_client_access on public.past_question_answer_key_import_items;
create policy past_question_answer_key_import_items_no_client_access
on public.past_question_answer_key_import_items
for all to anon, authenticated
using (false)
with check (false);

revoke all on public.past_question_answer_key_imports from public, anon, authenticated;
revoke all on public.past_question_answer_key_import_items from public, anon, authenticated;
grant select, insert, update on public.past_question_answer_key_imports to service_role;
grant select, insert, update on public.past_question_answer_key_import_items to service_role;

create index if not exists past_question_answer_key_imports_batch_idx on public.past_question_answer_key_imports(import_batch_id);
create index if not exists past_question_answer_key_imports_source_document_idx on public.past_question_answer_key_imports(source_document_id);
create index if not exists past_question_answer_key_imports_subject_id_idx on public.past_question_answer_key_imports(subject_id);
create index if not exists past_question_answer_key_imports_board_subject_year_idx on public.past_question_answer_key_imports(lower(board), subject_id, exam_year, status);
create index if not exists past_question_answer_key_items_import_idx on public.past_question_answer_key_import_items(import_id);
create index if not exists past_question_answer_key_items_question_idx on public.past_question_answer_key_import_items(past_question_id, status);

create or replace view public.past_question_answer_key_import_template
with (security_invoker = true) as
with candidate_documents as (
  select id, lower(trim(exam_board)) as board, exam_year, lower(trim(subject)) as subject_name, title, file_name, storage_path
  from public.documents
  where coalesce(is_active,true) = true and exam_board is not null
), raw_candidates as (
  select pq.id as past_question_id, lower(trim(pq.board)) as board, pq.year as exam_year, pq.subject_id, s.name as subject_name,
         pq.question_text, pq.options, pq.correct_answer, pq.answer_verified_at,
         pib.id as import_batch_id
  from public.past_questions pq
  join public.subjects s on s.id = pq.subject_id
  left join public.past_question_import_batches pib
    on lower(pib.board) = lower(pq.board)
   and pib.subject_id = pq.subject_id
   and pib.status in ('open','in_progress')
  where coalesce(pq.is_active,true) = true
    and pq.subject_id is not null
    and pq.year is not null
    and length(trim(coalesce(pq.question_text,''))) >= 15
    and pq.options is not null
    and jsonb_typeof(pq.options) = 'array'
    and jsonb_array_length(pq.options) >= 4
    and (pq.correct_answer is null or pq.answer_verified_at is null)
)
select rc.import_batch_id, rc.past_question_id, rc.board, rc.exam_year, rc.subject_id, rc.subject_name,
       left(rc.question_text, 180) as question_preview,
       jsonb_array_length(rc.options) as option_count,
       (
         select jsonb_agg(jsonb_build_object('sourceDocumentId', cd.id, 'title', cd.title, 'fileName', cd.file_name, 'storagePath', cd.storage_path)
                          order by cd.exam_year nulls last, cd.title)
         from candidate_documents cd
         where cd.board = rc.board
           and (cd.exam_year = rc.exam_year or cd.exam_year is null)
           and (cd.subject_name = lower(rc.subject_name) or cd.subject_name is null)
       ) as candidate_source_documents,
       case when rc.correct_answer is null then 'needs_answer_key'
            when rc.answer_verified_at is null then 'needs_source_verification'
            else 'ready' end as answer_key_status
from raw_candidates rc;

revoke all on public.past_question_answer_key_import_template from public, anon, authenticated;
grant select on public.past_question_answer_key_import_template to service_role;

create or replace function public.record_past_question_answer_key_verification(
  p_past_question_id uuid,
  p_answer_key text,
  p_source_document_id uuid,
  p_import_batch_id uuid default null,
  p_source_excerpt text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_question public.past_questions%rowtype;
  v_document public.documents%rowtype;
  v_subject_name text;
  v_answer text := upper(trim(p_answer_key));
  v_import_id uuid;
  v_item_id uuid;
  v_option_exists boolean;
begin
  if v_answer not in ('A','B','C','D','E') then raise exception 'answer_key_must_be_A_to_E'; end if;

  select * into v_question from public.past_questions where id = p_past_question_id and coalesce(is_active,true) = true;
  if not found then raise exception 'active_past_question_not_found'; end if;

  select * into v_document from public.documents where id = p_source_document_id and coalesce(is_active,true) = true;
  if not found then raise exception 'active_source_document_not_found'; end if;

  select name into v_subject_name from public.subjects where id = v_question.subject_id;
  if v_question.subject_id is null or v_subject_name is null then raise exception 'question_subject_missing'; end if;
  if length(trim(coalesce(v_question.question_text,''))) < 15 then raise exception 'question_stem_too_short'; end if;
  if v_question.options is null or jsonb_typeof(v_question.options) <> 'array' or jsonb_array_length(v_question.options) < 4 then raise exception 'question_options_not_scoreable'; end if;

  select exists (
    select 1 from jsonb_array_elements(v_question.options) opt
    where upper(coalesce(opt->>'id', opt#>>'{}')) = v_answer
  ) into v_option_exists;
  if not coalesce(v_option_exists,false) then raise exception 'answer_key_not_present_in_options'; end if;

  if lower(trim(coalesce(v_document.exam_board,''))) <> lower(trim(coalesce(v_question.board,''))) then raise exception 'source_document_board_mismatch'; end if;
  if v_document.exam_year is not null and v_question.year is not null and v_document.exam_year <> v_question.year then raise exception 'source_document_year_mismatch'; end if;
  if v_document.subject is not null and lower(trim(v_document.subject)) <> lower(trim(v_subject_name)) then raise exception 'source_document_subject_mismatch'; end if;

  insert into public.past_question_answer_key_imports(import_batch_id, source_document_id, board, subject_id, exam_year, source_label, status, notes)
  values (p_import_batch_id, p_source_document_id, lower(trim(v_question.board)), v_question.subject_id, v_question.year,
          coalesce(v_document.title, v_document.file_name, v_document.storage_path, p_source_document_id::text), 'partially_applied', p_notes)
  returning id into v_import_id;

  insert into public.past_question_answer_key_import_items(import_id, past_question_id, answer_key, source_excerpt, status, applied_at)
  values (v_import_id, p_past_question_id, v_answer, p_source_excerpt, 'applied', now())
  returning id into v_item_id;

  update public.past_questions
  set correct_answer = to_jsonb(v_answer),
      answer_source = coalesce(nullif(trim(p_source_excerpt),''), 'source_document:' || p_source_document_id::text),
      answer_verified_at = now(),
      updated_at = now()
  where id = p_past_question_id;

  insert into public.past_question_answer_verifications(question_id, source_document_id, batch_id, decision, verification_method, verified_answer, reviewer_notes)
  values (p_past_question_id, p_source_document_id, p_import_batch_id, 'approved', 'source_document_answer_key_import', to_jsonb(v_answer), p_notes);

  update public.past_question_import_batches
  set status = case when status = 'open' then 'in_progress' else status end,
      updated_at = now()
  where id = p_import_batch_id;

  return jsonb_build_object('status','applied','pastQuestionId',p_past_question_id,'answerKey',v_answer,'sourceDocumentId',p_source_document_id,'importId',v_import_id,'itemId',v_item_id);
end;
$$;

revoke all on function public.record_past_question_answer_key_verification(uuid,text,uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.record_past_question_answer_key_verification(uuid,text,uuid,uuid,text,text) to service_role;

create or replace function public.get_past_question_answer_key_ingestion_system()
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  with template_summary as (
    select count(*)::int as candidate_rows,
           count(*) filter (where candidate_source_documents is not null)::int as rows_with_candidate_documents,
           count(*) filter (where answer_key_status = 'needs_answer_key')::int as rows_needing_answer_keys,
           count(*) filter (where answer_key_status = 'needs_source_verification')::int as rows_needing_source_verification
    from public.past_question_answer_key_import_template
  ), imports_summary as (
    select count(*)::int as imports_total,
           count(*) filter (where status in ('partially_applied','applied'))::int as imports_applied_or_partial
    from public.past_question_answer_key_imports
  ), item_summary as (
    select count(*)::int as imported_answer_items,
           count(*) filter (where status = 'applied')::int as applied_answer_items
    from public.past_question_answer_key_import_items
  )
  select jsonb_build_object(
    'template', to_jsonb(template_summary),
    'imports', to_jsonb(imports_summary),
    'items', to_jsonb(item_summary),
    'topTemplateRows', coalesce((
      select jsonb_agg(to_jsonb(x))
      from (
        select board, subject_name, exam_year, count(*)::int as rows_needing_keys,
               count(*) filter (where candidate_source_documents is not null)::int as rows_with_candidate_documents
        from public.past_question_answer_key_import_template
        group by board, subject_name, exam_year
        order by rows_needing_keys desc, rows_with_candidate_documents desc
        limit 20
      ) x
    ), '[]'::jsonb)
  )
  from template_summary, imports_summary, item_summary;
$$;

revoke all on function public.get_past_question_answer_key_ingestion_system() from public, anon, authenticated;
grant execute on function public.get_past_question_answer_key_ingestion_system() to service_role;
