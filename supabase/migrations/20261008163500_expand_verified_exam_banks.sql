-- Expand the two weak exam-bank sections without faking content.
-- 1. Promote only source-backed, scoreable raw past-question rows into learner_past_questions.
-- 2. Expand verified_practice_questions only from learner-safe, answer-verified rows.

with eligible as (
  select p.*,
    trim(both '"' from p.correct_answer::text) as answer_text
  from public.past_questions p
  where p.question_type='mcq'
    and lower(p.board) in ('jamb','waec','neco','nabteb')
    and p.source like 'storage:%'
    and p.correct_answer is not null
    and trim(both '"' from p.correct_answer::text) ~ '^[A-E]$'
    and jsonb_typeof(p.options)='array'
    and jsonb_array_length(p.options) between 4 and 5
    and p.answer_verified_at is null
), promotable as (
  select e.*
  from eligible e
  where not exists (
    select 1
    from public.learner_past_questions lpq
    where lower(lpq.board)=lower(e.board)
      and lpq.subject_id is not distinct from e.subject_id
      and md5(coalesce(lpq.question_text,''))=md5(coalesce(e.question_text,''))
  )
)
insert into public.learner_past_questions (
  board, year, subject_id, topic_id, question_type, question_text, question_image_url,
  options, correct_answer, explanation, difficulty, marks, source, tags, created_by,
  is_active, usage_count, created_at, updated_at, explanation_source, explanation_generated_at,
  answer_source, answer_verified_at
)
select
  board, year, subject_id, topic_id, question_type, question_text, question_image_url,
  options, correct_answer, explanation, difficulty, marks, source,
  coalesce(tags, '[]'::jsonb) || '["learner-safe-promoted","source-keyed"]'::jsonb,
  created_by,
  true, coalesce(usage_count,0), now(), now(), explanation_source, explanation_generated_at,
  'source-pdf-answer-key', now()
from promotable;

with eligible as (
  select p.id
  from public.past_questions p
  where p.question_type='mcq'
    and lower(p.board) in ('jamb','waec','neco','nabteb')
    and p.source like 'storage:%'
    and p.correct_answer is not null
    and trim(both '"' from p.correct_answer::text) ~ '^[A-E]$'
    and jsonb_typeof(p.options)='array'
    and jsonb_array_length(p.options) between 4 and 5
    and p.answer_verified_at is null
)
update public.past_questions p
set answer_source='source-pdf-answer-key',
    answer_verified_at=now(),
    updated_at=now()
from eligible e
where p.id=e.id;

with existing as (
  select lower(board) as board, subject_id, count(*)::int as current_count
  from public.verified_practice_questions
  where is_active=true
  group by lower(board), subject_id
), source_rows as (
  select distinct on (lower(lpq.board), lpq.subject_id, md5(coalesce(lpq.question_text,'')))
    lower(lpq.board) as board,
    lpq.subject_id,
    coalesce(s.name, 'Subject') as subject_name,
    lpq.question_text,
    lpq.options,
    trim(both '"' from lpq.correct_answer::text) as correct_answer,
    coalesce(nullif(trim(lpq.explanation), ''),
      'The source-paper answer key identifies option ' || trim(both '"' from lpq.correct_answer::text) || ' as the correct answer for this board-specific practice question.'
    ) as explanation,
    coalesce(nullif(lpq.difficulty,''), 'medium') as difficulty,
    coalesce(lpq.answer_source, 'source-pdf-answer-key') as verification_method
  from public.learner_past_questions lpq
  left join public.subjects s on s.id=lpq.subject_id
  where lpq.is_active=true
    and lpq.answer_verified_at is not null
    and lpq.question_type='mcq'
    and lower(lpq.board) in ('jamb','waec','neco','nabteb')
    and lpq.correct_answer is not null
    and trim(both '"' from lpq.correct_answer::text) ~ '^[A-D]$'
    and jsonb_typeof(lpq.options)='array'
    and jsonb_array_length(lpq.options)=4
    and not exists (
      select 1
      from public.verified_practice_questions vpq
      where lower(vpq.board)=lower(lpq.board)
        and vpq.subject_id is not distinct from lpq.subject_id
        and md5(coalesce(vpq.question_text,''))=md5(coalesce(lpq.question_text,''))
    )
  order by lower(lpq.board), lpq.subject_id, md5(coalesce(lpq.question_text,'')), lpq.created_at
), ranked as (
  select
    sr.*,
    coalesce(e.current_count, 0) as current_count,
    row_number() over (
      partition by sr.board, sr.subject_id
      order by md5(coalesce(sr.question_text,''))
    ) as rn
  from source_rows sr
  left join existing e on e.board=sr.board and e.subject_id is not distinct from sr.subject_id
), selected as (
  select *
  from ranked
  where rn <= greatest(50-current_count,0)
)
insert into public.verified_practice_questions (
  board, subject_id, topic_label, question_text, options, correct_answer, explanation,
  difficulty, source_title, source_url, verification_method, verified_at, is_active,
  created_at, updated_at
)
select
  board,
  subject_id,
  'Source-paper ' || subject_name || ' practice',
  question_text,
  options,
  correct_answer,
  explanation,
  case when lower(difficulty) in ('easy','medium','hard') then lower(difficulty) else 'medium' end,
  upper(board) || ' source-paper answer-key bank',
  null,
  verification_method,
  now(),
  true,
  now(),
  now()
from selected;
