-- Nigerian multi-subject CBT configuration.
-- Keeps the legacy exams.subject_id for compatibility while allowing a single
-- exam to contain multiple subject sections (e.g. a JAMB-style 4-subject CBT).
create table if not exists public.exam_subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  section_name varchar(150),
  question_count integer not null default 0 check (question_count >= 0),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (exam_id, subject_id),
  unique (exam_id, order_index)
);

create index if not exists exam_subjects_exam_id_idx on public.exam_subjects(exam_id);
create index if not exists exam_subjects_subject_id_idx on public.exam_subjects(subject_id);

alter table public.exams add column if not exists exam_mode varchar(40) not null default 'single_subject';
alter table public.exams add column if not exists max_subjects integer not null default 1 check (max_subjects between 1 and 9);

alter table public.exam_subjects enable row level security;

create policy "Authenticated users can read exam subjects"
  on public.exam_subjects for select
  to authenticated
  using (true);

create policy "Authenticated users can manage exam subjects"
  on public.exam_subjects for all
  to authenticated
  using (true)
  with check (true);
