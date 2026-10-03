-- Reconcile past-question file tracking with the actual structured question rows.
with linked as (
  select f.id,
         count(pq.*)::integer as question_count,
         count(pq.*) filter(where pq.is_active)::integer as active_count,
         count(pq.*) filter(where pq.correct_answer is not null)::integer as answered_count
  from public.past_question_files f
  left join public.past_questions pq
    on pq.source = 'storage:' || f.id::text
  group by f.id
)
update public.past_question_files f
set questions_extracted = linked.question_count,
    metadata = coalesce(f.metadata,'{}'::jsonb)
      || jsonb_build_object(
        'linked_questions', linked.question_count,
        'active_questions', linked.active_count,
        'answered_questions', linked.answered_count,
        'tracking_reconciled_at', now()
      ),
    updated_at = now()
from linked
where f.id = linked.id
  and (
    coalesce(f.questions_extracted,-1) <> linked.question_count
    or coalesce((f.metadata->>'active_questions')::integer,-1) <> linked.active_count
    or coalesce((f.metadata->>'answered_questions')::integer,-1) <> linked.answered_count
  );
