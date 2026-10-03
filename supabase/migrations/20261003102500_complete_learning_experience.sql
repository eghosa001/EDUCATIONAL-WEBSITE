-- Complete the lesson-practice path without exposing answer keys to clients.
-- This migration also retires the low-quality objective-recognition question bank.

create table if not exists public.lesson_practice_sets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  content_fingerprint text not null,
  questions jsonb not null,
  generation_method text not null default 'grounded-fallback',
  source_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_practice_sets_questions_array
    check (jsonb_typeof(questions) = 'array'),
  constraint lesson_practice_sets_question_count
    check (jsonb_array_length(questions) between 3 and 10),
  constraint lesson_practice_sets_generation_method
    check (generation_method in ('ai', 'grounded-fallback'))
);

create index if not exists lesson_practice_sets_lesson_idx
  on public.lesson_practice_sets (lesson_id);

alter table public.lesson_practice_sets enable row level security;

-- The Edge Function owns this cache. Learners receive questions through the
-- authenticated lesson-practice function instead of reading answer keys directly.
revoke all on table public.lesson_practice_sets from anon, authenticated;
grant all on table public.lesson_practice_sets to service_role;

-- The old generated bank only tested whether learners could recognise the stored
-- curriculum objective. Keep it for audit/history, but never surface it as practice.
update public.questions
set is_active = false,
    updated_at = now()
where source = 'THE GUIDE Curriculum Practice'
  and is_active = true;

-- Keep source-file counters aligned with the questions that actually survived
-- extraction-quality filtering.
with actual as (
  select
    replace(source, 'storage:', '')::uuid as file_id,
    count(*) filter (where is_active) as active_rows
  from public.past_questions
  where source like 'storage:%'
  group by 1
)
update public.past_question_files f
set questions_extracted = coalesce(a.active_rows, 0),
    updated_at = now()
from actual a
where f.id = a.file_id
  and f.questions_extracted is distinct from a.active_rows;
