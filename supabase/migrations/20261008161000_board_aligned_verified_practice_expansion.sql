-- Expand verified-practice coverage from already learner-safe curriculum questions.
-- These rows are deliberately labelled as board-aligned curriculum practice, not historical past papers.

with deficits as (
  select board, subject_id, subject_name, greatest(50-active_count,0) as needed
  from public.learning_content_coverage
  where bank_type='verified_practice_questions' and active_count < 50
), candidates as (
  select
    d.board,
    d.subject_id,
    d.subject_name,
    d.needed,
    q.id as question_id,
    q.question_text,
    q.options,
    case
      when q.correct_answer ? 'A' then 'A'
      when q.correct_answer ? 'B' then 'B'
      when q.correct_answer ? 'C' then 'C'
      when q.correct_answer ? 'D' then 'D'
      else null
    end as correct_answer,
    q.explanation,
    coalesce(nullif(q.difficulty,''),'medium') as difficulty,
    row_number() over (
      partition by d.board, d.subject_id
      order by q.created_at desc, q.id
    ) as rn
  from deficits d
  join public.questions q on q.subject_id=d.subject_id
  where q.is_active=true
    and q.options is not null
    and jsonb_typeof(q.options)='array'
    and jsonb_array_length(q.options)=4
    and q.correct_answer ?| array['A','B','C','D']
    and coalesce(q.explanation,'') <> ''
    and not exists (
      select 1 from public.verified_practice_questions vpq
      where vpq.board=d.board
        and vpq.subject_id=d.subject_id
        and md5(vpq.question_text)=md5(q.question_text)
    )
), selected as (
  select * from candidates
  where rn <= needed and correct_answer is not null
)
insert into public.verified_practice_questions (
  board,
  subject_id,
  topic_label,
  question_text,
  options,
  correct_answer,
  explanation,
  difficulty,
  source_title,
  source_url,
  verification_method,
  verified_at,
  is_active,
  updated_at
)
select
  board,
  subject_id,
  'Board-aligned curriculum practice' as topic_label,
  question_text,
  options,
  correct_answer,
  explanation,
  case when difficulty in ('easy','medium','hard') then difficulty else 'medium' end,
  'THE GUIDE Published Curriculum Question Bank' as source_title,
  'internal:curriculum_questions/' || question_id::text as source_url,
  'curriculum-grounded-board-practice' as verification_method,
  now(),
  true,
  now()
from selected
on conflict do nothing;

-- Second pass: fill remaining verified-practice deficits with de-duplicated curriculum questions.
with deficits as (
  select board, subject_id, subject_name, greatest(50-active_count,0) as needed
  from public.learning_content_coverage
  where bank_type='verified_practice_questions' and active_count < 50
), distinct_candidates as (
  select distinct on (d.board, d.subject_id, md5(q.question_text))
    d.board,
    d.subject_id,
    d.subject_name,
    d.needed,
    q.id as question_id,
    q.question_text,
    q.options,
    case
      when q.correct_answer ? 'A' then 'A'
      when q.correct_answer ? 'B' then 'B'
      when q.correct_answer ? 'C' then 'C'
      when q.correct_answer ? 'D' then 'D'
      else null
    end as correct_answer,
    q.explanation,
    coalesce(nullif(q.difficulty,''),'medium') as difficulty,
    q.created_at
  from deficits d
  join public.questions q on q.subject_id=d.subject_id
  where q.is_active=true
    and q.options is not null
    and jsonb_typeof(q.options)='array'
    and jsonb_array_length(q.options)=4
    and q.correct_answer ?| array['A','B','C','D']
    and coalesce(q.explanation,'') <> ''
    and not exists (
      select 1 from public.verified_practice_questions vpq
      where vpq.board=d.board
        and vpq.subject_id=d.subject_id
        and md5(vpq.question_text)=md5(q.question_text)
    )
  order by d.board, d.subject_id, md5(q.question_text), q.created_at desc, q.id
), numbered as (
  select *, row_number() over (partition by board, subject_id order by created_at desc, question_id) as rn
  from distinct_candidates
), selected as (
  select * from numbered where rn <= needed and correct_answer is not null
)
insert into public.verified_practice_questions (
  board, subject_id, topic_label, question_text, options, correct_answer, explanation,
  difficulty, source_title, source_url, verification_method, verified_at, is_active, updated_at
)
select
  board,
  subject_id,
  'Board-aligned curriculum practice' as topic_label,
  question_text,
  options,
  correct_answer,
  explanation,
  case when difficulty in ('easy','medium','hard') then difficulty else 'medium' end,
  'THE GUIDE Published Curriculum Question Bank' as source_title,
  'internal:curriculum_questions/' || question_id::text as source_url,
  'curriculum-grounded-board-practice-deduped' as verification_method,
  now(),
  true,
  now()
from selected
on conflict do nothing;
