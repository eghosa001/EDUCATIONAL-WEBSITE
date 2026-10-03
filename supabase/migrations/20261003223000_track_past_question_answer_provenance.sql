-- Record where verified past-question answer keys came from.
alter table public.past_questions
  add column if not exists answer_source text,
  add column if not exists answer_verified_at timestamptz;
