-- Keep verified examination questions available while learner APIs quarantine generic
-- curriculum-objective filler. This is intentionally narrow: only rows already carrying
-- a known examination source and a stored correct answer are re-enabled.
update public.questions
set is_active = true,
    updated_at = now()
where coalesce(source, '') ~* '^(WAEC|JAMB|NECO|NABTEB)[[:space:]]+[0-9]{4}$'
  and correct_answer is not null
  and correct_answer <> 'null'::jsonb;
