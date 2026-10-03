-- Track provenance for cached past-question explanations.
alter table public.past_questions
  add column if not exists explanation_source varchar(32),
  add column if not exists explanation_generated_at timestamptz;

update public.past_questions
set explanation_source = 'source'
where nullif(trim(explanation), '') is not null
  and explanation_source is null;
