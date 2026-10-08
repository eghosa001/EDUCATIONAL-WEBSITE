-- Content count and quality coverage gate for learner-facing banks.
-- This does not inflate question counts. It measures readiness and exposes deficits so thin banks cannot look complete.

create or replace view public.learning_content_coverage
with (security_invoker = true) as
with learner_past as (
  select
    'learner_past_questions'::text as bank_type,
    lower(coalesce(lpq.board, 'unknown')) as board,
    lpq.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*) filter (where lpq.is_active = true)::int as active_count,
    count(*) filter (where lpq.answer_verified_at is not null)::int as verified_count,
    count(*) filter (where lpq.explanation is not null and length(trim(lpq.explanation)) > 20)::int as explanation_count,
    100::int as target_9_plus_count,
    40::int as minimum_usable_count
  from public.learner_past_questions lpq
  left join public.subjects s on s.id = lpq.subject_id
  group by lower(coalesce(lpq.board, 'unknown')), lpq.subject_id, coalesce(s.name, 'Unknown')
), verified_practice as (
  select
    'verified_practice_questions'::text as bank_type,
    lower(coalesce(vpq.board, 'unknown')) as board,
    vpq.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*) filter (where vpq.is_active = true)::int as active_count,
    count(*) filter (where vpq.is_active = true and vpq.verified_at is not null)::int as verified_count,
    count(*) filter (where vpq.is_active = true and vpq.explanation is not null and length(trim(vpq.explanation)) > 20)::int as explanation_count,
    50::int as target_9_plus_count,
    20::int as minimum_usable_count
  from public.verified_practice_questions vpq
  left join public.subjects s on s.id = vpq.subject_id
  group by lower(coalesce(vpq.board, 'unknown')), vpq.subject_id, coalesce(s.name, 'Unknown')
), curriculum_questions as (
  select
    'curriculum_questions'::text as bank_type,
    'curriculum'::text as board,
    q.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*) filter (where q.is_active = true)::int as active_count,
    count(*) filter (
      where q.is_active = true
        and q.options is not null
        and jsonb_typeof(q.options) = 'array'
        and jsonb_array_length(q.options) >= 2
        and q.correct_answer is not null
    )::int as verified_count,
    0::int as explanation_count,
    50::int as target_9_plus_count,
    20::int as minimum_usable_count
  from public.questions q
  left join public.subjects s on s.id = q.subject_id
  group by q.subject_id, coalesce(s.name, 'Unknown')
), flashcard_bank as (
  select
    'flashcards'::text as bank_type,
    'curriculum'::text as board,
    f.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*)::int as active_count,
    count(*)::int as verified_count,
    count(*)::int as explanation_count,
    100::int as target_9_plus_count,
    30::int as minimum_usable_count
  from public.flashcards f
  left join public.subjects s on s.id = f.subject_id
  group by f.subject_id, coalesce(s.name, 'Unknown')
), lesson_bank as (
  select
    'published_lessons'::text as bank_type,
    'curriculum'::text as board,
    t.subject_id,
    coalesce(s.name, 'Unknown') as subject_name,
    count(*)::int as raw_count,
    count(*) filter (where l.is_published = true)::int as active_count,
    count(*) filter (where l.is_published = true and coalesce(l.content_quality, 'ready') <> 'needs_review')::int as verified_count,
    0::int as explanation_count,
    20::int as target_9_plus_count,
    10::int as minimum_usable_count
  from public.lessons l
  left join public.topics t on t.id = l.topic_id
  left join public.subjects s on s.id = t.subject_id
  group by t.subject_id, coalesce(s.name, 'Unknown')
), combined as (
  select * from learner_past
  union all select * from verified_practice
  union all select * from curriculum_questions
  union all select * from flashcard_bank
  union all select * from lesson_bank
)
select
  bank_type,
  board,
  subject_id,
  subject_name,
  raw_count,
  active_count,
  verified_count,
  explanation_count,
  target_9_plus_count,
  minimum_usable_count,
  greatest(target_9_plus_count - active_count, 0)::int as deficit_to_9_plus,
  case
    when active_count >= target_9_plus_count and verified_count >= least(target_9_plus_count, active_count) then '9+'
    when active_count >= minimum_usable_count and verified_count >= minimum_usable_count then 'usable'
    when active_count > 0 then 'thin'
    else 'empty'
  end as coverage_status
from combined;

revoke all on table public.learning_content_coverage from public, anon, authenticated;
grant select on table public.learning_content_coverage to service_role;

create or replace function public.get_learning_content_coverage()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'bankType', bank_type,
        'board', board,
        'subjectId', subject_id,
        'subjectName', subject_name,
        'rawCount', raw_count,
        'activeCount', active_count,
        'verifiedCount', verified_count,
        'explanationCount', explanation_count,
        'target9PlusCount', target_9_plus_count,
        'minimumUsableCount', minimum_usable_count,
        'deficitTo9Plus', deficit_to_9_plus,
        'coverageStatus', coverage_status
      )
      order by bank_type, board, subject_name
    ),
    '[]'::jsonb
  )
  from public.learning_content_coverage;
$$;

revoke all on function public.get_learning_content_coverage() from public, anon, authenticated;
grant execute on function public.get_learning_content_coverage() to service_role;
