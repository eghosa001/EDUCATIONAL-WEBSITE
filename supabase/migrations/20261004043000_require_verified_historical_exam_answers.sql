-- Require explicit answer provenance for learner-facing historical exam questions.
-- Safely retro-verify only rows from archived JAMB PDFs explicitly identified as
-- Questions-and-Answers material where the stored answer resolves uniquely.

with retro_candidates as (
  select pq.id
  from public.past_questions pq
  join public.past_question_files f
    on f.id=replace(pq.source,'storage:','')::uuid
  where pq.is_active=true
    and lower(pq.board)='jamb'
    and pq.question_type='mcq'
    and pq.correct_answer is not null
    and pq.answer_verified_at is null
    and pq.answer_source is null
    and pq.source like 'storage:%'
    and f.file_name ~* 'questions?.{0,12}(and|&).{0,12}answers?|answers?.{0,12}(and|&).{0,12}questions?'
    and jsonb_typeof(pq.options)='array'
    and jsonb_array_length(pq.options)>=2
    and (
      select count(*)
      from jsonb_array_elements(pq.options) opt
      where lower(trim(coalesce(
        opt->>'id',opt->>'value',opt->>'label',opt->>'text',opt#>>'{}'
      ))) = lower(trim(coalesce(
        pq.correct_answer->>'id',pq.correct_answer->>'value',pq.correct_answer->>'label',
        pq.correct_answer->>'answer',pq.correct_answer#>>'{}'
      )))
    )=1
)
update public.past_questions pq
set answer_source='source-pdf-embedded-answer',
    answer_verified_at=now(),
    updated_at=now()
from retro_candidates c
where pq.id=c.id;

create or replace view public.learner_past_questions
with (security_invoker = true)
as
select pq.*
from public.past_questions pq
where pq.is_active = true
  and lower(pq.board) in ('jamb','waec','neco','nabteb')
  and pq.question_type = 'mcq'
  and pq.correct_answer is not null
  and pq.source like 'storage:%'
  and pq.answer_verified_at is not null
  and pq.answer_source in (
    'manual-content-validation',
    'public-archive-cross-validation',
    'source-pdf-answer-key',
    'source-pdf-embedded-answer'
  )
  and jsonb_typeof(pq.options) = 'array'
  and jsonb_array_length(pq.options) >= 2
  and (
    select count(*)
    from jsonb_array_elements(pq.options) as opt
    where lower(trim(coalesce(
      opt->>'id',
      opt->>'value',
      opt->>'label',
      opt->>'text',
      opt#>>'{}'
    ))) = lower(trim(coalesce(
      pq.correct_answer->>'id',
      pq.correct_answer->>'value',
      pq.correct_answer->>'label',
      pq.correct_answer->>'answer',
      pq.correct_answer#>>'{}'
    )))
  ) = 1;

revoke all on table public.learner_past_questions from public, anon, authenticated;
grant select on table public.learner_past_questions to service_role;
