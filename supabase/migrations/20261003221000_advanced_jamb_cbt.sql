-- Advanced JAMB CBT sessions and course presets.
create table if not exists public.jamb_course_presets (
  id uuid primary key default gen_random_uuid(),
  course_name text not null unique,
  aliases text[] not null default '{}',
  notes text,
  source_url text not null default 'https://eligibility.jamb.gov.ng/',
  is_active boolean not null default true,
  priority integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jamb_course_preset_subjects (
  preset_id uuid not null references public.jamb_course_presets(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  order_index integer not null check (order_index between 1 and 4),
  primary key (preset_id, subject_id),
  unique (preset_id, order_index)
);

create table if not exists public.jamb_cbt_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_preset_id uuid references public.jamb_course_presets(id) on delete set null,
  duration_minutes integer not null check (duration_minutes between 5 and 240),
  subject_plan jsonb not null,
  questions jsonb not null,
  question_count integer not null check (question_count between 1 and 200),
  status text not null default 'active' check (status in ('active','submitted','expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  submitted_at timestamptz,
  score integer,
  percentage numeric(5,2)
);

create index if not exists jamb_cbt_sessions_user_started_idx
  on public.jamb_cbt_sessions(user_id, started_at desc);
create index if not exists jamb_cbt_sessions_status_expires_idx
  on public.jamb_cbt_sessions(status, expires_at);
create index if not exists jamb_course_preset_subjects_subject_idx
  on public.jamb_course_preset_subjects(subject_id);

alter table public.jamb_course_presets enable row level security;
alter table public.jamb_course_preset_subjects enable row level security;
alter table public.jamb_cbt_sessions enable row level security;

revoke all on public.jamb_course_presets from anon, authenticated;
revoke all on public.jamb_course_preset_subjects from anon, authenticated;
revoke all on public.jamb_cbt_sessions from anon, authenticated;
grant select,insert,update,delete on public.jamb_course_presets to service_role;
grant select,insert,update,delete on public.jamb_course_preset_subjects to service_role;
grant select,insert,update,delete on public.jamb_cbt_sessions to service_role;

drop policy if exists jamb_course_presets_deny_clients on public.jamb_course_presets;
create policy jamb_course_presets_deny_clients on public.jamb_course_presets
for all to anon, authenticated using (false) with check (false);

drop policy if exists jamb_course_preset_subjects_deny_clients on public.jamb_course_preset_subjects;
create policy jamb_course_preset_subjects_deny_clients on public.jamb_course_preset_subjects
for all to anon, authenticated using (false) with check (false);

drop policy if exists jamb_cbt_sessions_deny_clients on public.jamb_cbt_sessions;
create policy jamb_cbt_sessions_deny_clients on public.jamb_cbt_sessions
for all to anon, authenticated using (false) with check (false);

insert into public.jamb_course_presets(course_name,aliases,notes,priority)
values
('Medicine & Surgery',array['Medicine','MBBS'],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',10),
('Dentistry & Dental Surgery',array['Dentistry','BDS'],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',11),
('Nursing Science',array['Nursing'],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',12),
('Pharmacy',array['Pharmaceutical Sciences'],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',13),
('Medical Laboratory Science',array['MLS'],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',14),
('Physiotherapy',array['Physical Therapy'],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',15),
('Optometry',array[]::text[],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',16),
('Anatomy',array[]::text[],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',17),
('Physiology',array[]::text[],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',18),
('Biochemistry',array[]::text[],'Common preparation preset: Use of English, Biology, Chemistry and Physics. Verify your target institution in JAMB IBASS.',19),
('Mechanical Engineering',array['Mechanical Engr'],'Common preparation preset: Use of English, Mathematics, Physics and Chemistry. Verify your target institution in JAMB IBASS.',20),
('Civil Engineering',array['Civil Engr'],'Common preparation preset: Use of English, Mathematics, Physics and Chemistry. Verify your target institution in JAMB IBASS.',21),
('Electrical/Electronics Engineering',array['Electrical Engineering','Electronics Engineering','EEE'],'Common preparation preset: Use of English, Mathematics, Physics and Chemistry. Verify your target institution in JAMB IBASS.',22),
('Chemical Engineering',array['Chemical Engr'],'Common preparation preset: Use of English, Mathematics, Physics and Chemistry. Verify your target institution in JAMB IBASS.',23),
('Petroleum Engineering',array['Petroleum Engr'],'Common preparation preset: Use of English, Mathematics, Physics and Chemistry. Verify your target institution in JAMB IBASS.',24),
('Computer Engineering',array['Computer Engr'],'Common preparation preset: Use of English, Mathematics, Physics and Chemistry. Verify your target institution in JAMB IBASS.',25),
('Software Engineering',array['Software Engr'],'Common preparation preset used for practice: Use of English, Mathematics, Physics and Chemistry. Verify institution-specific requirements in JAMB IBASS.',26),
('Computer Science',array['Computer Sci'],'Common preparation preset used for practice: Use of English, Mathematics, Physics and Chemistry. Verify institution-specific requirements in JAMB IBASS.',27),
('Architecture',array[]::text[],'Common preparation preset used for practice: Use of English, Mathematics, Physics and Chemistry. Verify institution-specific requirements in JAMB IBASS.',28),
('Accounting',array['Accountancy'],'Common preparation preset used for practice: Use of English, Mathematics, Economics and Government. Verify institution-specific requirements in JAMB IBASS.',40),
('Business Administration',array['Business Admin'],'Common preparation preset used for practice: Use of English, Mathematics, Economics and Government. Verify institution-specific requirements in JAMB IBASS.',41),
('Economics',array[]::text[],'Common preparation preset used for practice: Use of English, Mathematics, Economics and Government. Verify institution-specific requirements in JAMB IBASS.',42),
('Law',array['LLB'],'Common preparation preset used for practice: Use of English, Literature in English, Government and Christian Religious Studies. Requirements vary; verify your institution in JAMB IBASS.',50),
('Mass Communication',array['Mass Comm'],'Common preparation preset used for practice: Use of English, Literature in English, Government and Economics. Verify institution-specific requirements in JAMB IBASS.',51),
('Political Science',array[]::text[],'Common preparation preset used for practice: Use of English, Government, Economics and Literature in English. Verify institution-specific requirements in JAMB IBASS.',52)
on conflict (course_name) do update set aliases=excluded.aliases,notes=excluded.notes,priority=excluded.priority,updated_at=now();

with subject_map as (select id,name from public.subjects where is_active=true),
desired(course_name,subject_name,order_index) as (
  values
    ('Medicine & Surgery','English Language',1),('Medicine & Surgery','Biology',2),('Medicine & Surgery','Chemistry',3),('Medicine & Surgery','Physics',4),
    ('Dentistry & Dental Surgery','English Language',1),('Dentistry & Dental Surgery','Biology',2),('Dentistry & Dental Surgery','Chemistry',3),('Dentistry & Dental Surgery','Physics',4),
    ('Nursing Science','English Language',1),('Nursing Science','Biology',2),('Nursing Science','Chemistry',3),('Nursing Science','Physics',4),
    ('Pharmacy','English Language',1),('Pharmacy','Biology',2),('Pharmacy','Chemistry',3),('Pharmacy','Physics',4),
    ('Medical Laboratory Science','English Language',1),('Medical Laboratory Science','Biology',2),('Medical Laboratory Science','Chemistry',3),('Medical Laboratory Science','Physics',4),
    ('Physiotherapy','English Language',1),('Physiotherapy','Biology',2),('Physiotherapy','Chemistry',3),('Physiotherapy','Physics',4),
    ('Optometry','English Language',1),('Optometry','Biology',2),('Optometry','Chemistry',3),('Optometry','Physics',4),
    ('Anatomy','English Language',1),('Anatomy','Biology',2),('Anatomy','Chemistry',3),('Anatomy','Physics',4),
    ('Physiology','English Language',1),('Physiology','Biology',2),('Physiology','Chemistry',3),('Physiology','Physics',4),
    ('Biochemistry','English Language',1),('Biochemistry','Biology',2),('Biochemistry','Chemistry',3),('Biochemistry','Physics',4),
    ('Mechanical Engineering','English Language',1),('Mechanical Engineering','Mathematics',2),('Mechanical Engineering','Physics',3),('Mechanical Engineering','Chemistry',4),
    ('Civil Engineering','English Language',1),('Civil Engineering','Mathematics',2),('Civil Engineering','Physics',3),('Civil Engineering','Chemistry',4),
    ('Electrical/Electronics Engineering','English Language',1),('Electrical/Electronics Engineering','Mathematics',2),('Electrical/Electronics Engineering','Physics',3),('Electrical/Electronics Engineering','Chemistry',4),
    ('Chemical Engineering','English Language',1),('Chemical Engineering','Mathematics',2),('Chemical Engineering','Physics',3),('Chemical Engineering','Chemistry',4),
    ('Petroleum Engineering','English Language',1),('Petroleum Engineering','Mathematics',2),('Petroleum Engineering','Physics',3),('Petroleum Engineering','Chemistry',4),
    ('Computer Engineering','English Language',1),('Computer Engineering','Mathematics',2),('Computer Engineering','Physics',3),('Computer Engineering','Chemistry',4),
    ('Software Engineering','English Language',1),('Software Engineering','Mathematics',2),('Software Engineering','Physics',3),('Software Engineering','Chemistry',4),
    ('Computer Science','English Language',1),('Computer Science','Mathematics',2),('Computer Science','Physics',3),('Computer Science','Chemistry',4),
    ('Architecture','English Language',1),('Architecture','Mathematics',2),('Architecture','Physics',3),('Architecture','Chemistry',4),
    ('Accounting','English Language',1),('Accounting','Mathematics',2),('Accounting','Economics',3),('Accounting','Government',4),
    ('Business Administration','English Language',1),('Business Administration','Mathematics',2),('Business Administration','Economics',3),('Business Administration','Government',4),
    ('Economics','English Language',1),('Economics','Mathematics',2),('Economics','Economics',3),('Economics','Government',4),
    ('Law','English Language',1),('Law','Literature in English',2),('Law','Government',3),('Law','Christian Religious Studies',4),
    ('Mass Communication','English Language',1),('Mass Communication','Literature in English',2),('Mass Communication','Government',3),('Mass Communication','Economics',4),
    ('Political Science','English Language',1),('Political Science','Government',2),('Political Science','Economics',3),('Political Science','Literature in English',4)
)
insert into public.jamb_course_preset_subjects(preset_id,subject_id,order_index)
select p.id,s.id,d.order_index from desired d
join public.jamb_course_presets p on p.course_name=d.course_name
join subject_map s on s.name=d.subject_name
on conflict (preset_id,subject_id) do update set order_index=excluded.order_index;

create or replace function public.get_jamb_subject_availability()
returns table(subject_id uuid, question_count integer)
language sql stable security definer set search_path=public
as $$
  select pq.subject_id,count(*)::integer
  from public.past_questions pq
  where pq.is_active=true
    and lower(pq.board)='jamb'
    and pq.question_type='mcq'
    and pq.correct_answer is not null
  group by pq.subject_id;
$$;

revoke execute on function public.get_jamb_subject_availability() from public, anon, authenticated;
grant execute on function public.get_jamb_subject_availability() to service_role;
