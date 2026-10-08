-- Past-question source import control.
-- Does not generate or relabel historical past papers.
-- Provides admin/service-only visibility into what source papers, answer keys,
-- parsing, and verification work remains before past questions become learner-safe.

create or replace view public.learning_past_question_import_backlog
with (security_invoker = true) as
with gaps as (
  select board, subject_id, subject_name, active_count, verified_count,
         target_9_plus_count, deficit_to_9_plus, coverage_status, priority_rank
  from public.learning_content_gap_queue
  where bank_type = 'learner_past_questions'
), raw_stats as (
  select lower(board::text) board, subject_id,
         count(*) filter (where is_active = true) active_raw_rows,
         count(*) filter (where is_active = true and source::text like 'storage:%') storage_backed_rows,
         count(*) filter (where is_active = true and correct_answer is not null) keyed_rows,
         count(*) filter (where is_active = true and answer_verified_at is not null) answer_verified_rows,
         count(*) filter (
           where is_active = true
             and question_type::text = 'mcq'
             and source::text like 'storage:%'
             and correct_answer is not null
             and answer_verified_at is not null
             and answer_source in ('manual-content-validation','public-archive-cross-validation','source-pdf-answer-key','source-pdf-embedded-answer')
             and jsonb_typeof(options) = 'array'
             and jsonb_array_length(options) >= 2
             and char_length(trim(question_text)) >= 20
         ) learner_safe_eligible_rows,
         count(distinct year) filter (where is_active = true and year is not null) years_with_raw_rows,
         min(year) filter (where is_active = true and year is not null) oldest_raw_year,
         max(year) filter (where is_active = true and year is not null) newest_raw_year
  from public.past_questions
  where lower(board::text) in ('jamb','waec','neco','nabteb')
  group by lower(board::text), subject_id
), document_stats as (
  select lower(d.exam_board::text) board, s.id subject_id,
         count(*) filter (where d.is_active = true) active_source_documents,
         count(*) filter (where d.is_active = true and lower(coalesce(d.mime_type,'')) like '%pdf%') active_pdf_documents,
         count(distinct d.exam_year) filter (where d.is_active = true and d.exam_year is not null) years_with_documents,
         min(d.exam_year) filter (where d.is_active = true and d.exam_year is not null) oldest_document_year,
         max(d.exam_year) filter (where d.is_active = true and d.exam_year is not null) newest_document_year
  from public.documents d
  join public.subjects s on lower(trim(s.name)) = lower(trim(d.subject::text))
  where lower(coalesce(d.exam_board,'')) in ('jamb','waec','neco','nabteb')
  group by lower(d.exam_board::text), s.id
)
select g.board,
       g.subject_id,
       g.subject_name,
       g.active_count learner_safe_count,
       g.verified_count learner_safe_verified_count,
       g.target_9_plus_count,
       g.deficit_to_9_plus,
       g.coverage_status,
       coalesce(r.active_raw_rows, 0) active_raw_rows,
       coalesce(r.storage_backed_rows, 0) storage_backed_rows,
       coalesce(r.keyed_rows, 0) keyed_rows,
       coalesce(r.answer_verified_rows, 0) answer_verified_rows,
       coalesce(r.learner_safe_eligible_rows, 0) learner_safe_eligible_rows,
       coalesce(d.active_source_documents, 0) active_source_documents,
       coalesce(d.active_pdf_documents, 0) active_pdf_documents,
       coalesce(r.years_with_raw_rows, 0) years_with_raw_rows,
       coalesce(d.years_with_documents, 0) years_with_documents,
       r.oldest_raw_year,
       r.newest_raw_year,
       d.oldest_document_year,
       d.newest_document_year,
       case
         when coalesce(d.active_source_documents, 0) = 0 and coalesce(r.active_raw_rows, 0) = 0 then 'upload_source_paper_pdf_and_answer_key'
         when coalesce(r.active_raw_rows, 0) = 0 and coalesce(d.active_source_documents, 0) > 0 then 'parse_uploaded_source_documents'
         when coalesce(r.storage_backed_rows, 0) < g.target_9_plus_count then 'import_more_source_papers_with_answer_keys'
         when coalesce(r.answer_verified_rows, 0) < g.target_9_plus_count then 'verify_raw_answers_against_source_key'
         when coalesce(r.learner_safe_eligible_rows, 0) < g.target_9_plus_count then 'repair_raw_question_structure_or_options'
         else 'ready_for_safe_promotion_check'
       end next_action,
       case when g.coverage_status = 'thin' then 1 when g.coverage_status = 'usable' then 2 else 3 end import_priority
from gaps g
left join raw_stats r on r.board = g.board and r.subject_id = g.subject_id
left join document_stats d on d.board = g.board and d.subject_id = g.subject_id;

create or replace view public.learning_past_question_verification_queue
with (security_invoker = true) as
select pq.id past_question_id,
       lower(pq.board::text) board,
       pq.subject_id,
       s.name subject_name,
       pq.year,
       left(regexp_replace(coalesce(pq.question_text, ''), '\s+', ' ', 'g'), 160) question_preview,
       pq.source,
       pq.answer_source,
       pq.answer_verified_at,
       array_remove(array[
         case when pq.source is null or pq.source::text not like 'storage:%' then 'missing_storage_source' end,
         case when pq.question_type::text <> 'mcq' then 'not_mcq' end,
         case when pq.correct_answer is null then 'missing_answer_key' end,
         case when pq.answer_verified_at is null then 'answer_not_verified' end,
         case when pq.answer_source is null or pq.answer_source not in ('manual-content-validation','public-archive-cross-validation','source-pdf-answer-key','source-pdf-embedded-answer') then 'untrusted_answer_source' end,
         case when jsonb_typeof(pq.options) <> 'array' or jsonb_array_length(pq.options) < 2 then 'bad_or_missing_options' end,
         case when char_length(trim(coalesce(pq.question_text,''))) < 20 then 'short_or_missing_question_text' end
       ], null) issue_codes,
       case
         when pq.correct_answer is null or pq.answer_verified_at is null then 1
         when pq.source is null or pq.source::text not like 'storage:%' then 2
         when jsonb_typeof(pq.options) <> 'array' or jsonb_array_length(pq.options) < 2 then 3
         else 4
       end verification_priority,
       pq.created_at,
       pq.updated_at
from public.past_questions pq
join public.subjects s on s.id = pq.subject_id
where pq.is_active = true
  and lower(pq.board::text) in ('jamb','waec','neco','nabteb')
  and not (
    pq.question_type::text = 'mcq'
    and pq.source::text like 'storage:%'
    and pq.correct_answer is not null
    and pq.answer_verified_at is not null
    and pq.answer_source in ('manual-content-validation','public-archive-cross-validation','source-pdf-answer-key','source-pdf-embedded-answer')
    and jsonb_typeof(pq.options) = 'array'
    and jsonb_array_length(pq.options) >= 2
    and char_length(trim(pq.question_text)) >= 20
  );

create or replace function public.get_past_question_import_backlog()
returns setof public.learning_past_question_import_backlog
language sql
stable
security definer
set search_path = public
as $$
  select * from public.learning_past_question_import_backlog
  order by import_priority asc, deficit_to_9_plus desc, board, subject_name;
$$;

revoke all on public.learning_past_question_import_backlog from anon, authenticated;
revoke all on public.learning_past_question_verification_queue from anon, authenticated;
revoke all on function public.get_past_question_import_backlog() from anon, authenticated;
grant select on public.learning_past_question_import_backlog to service_role;
grant select on public.learning_past_question_verification_queue to service_role;
grant execute on function public.get_past_question_import_backlog() to service_role;
