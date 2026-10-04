create table if not exists public.exam_source_catalog (
  id uuid primary key default gen_random_uuid(),
  board text not null check (board in ('jamb','waec','neco','nabteb')),
  source_name text not null,
  source_url text not null,
  source_type text not null check (source_type in ('official-syllabus','official-practice-platform','official-examiner-report','official-guidance')),
  access_mode text not null check (access_mode in ('public','authenticated','gated')),
  rights_status text not null check (rights_status in ('reference-only','permission-required','licensed')),
  ingestion_status text not null default 'reference-only' check (ingestion_status in ('reference-only','pending-rights','approved','blocked')),
  learner_import_allowed boolean not null default false,
  verified_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(board, source_url)
);

alter table public.exam_source_catalog enable row level security;
drop policy if exists exam_source_catalog_no_client_access on public.exam_source_catalog;
create policy exam_source_catalog_no_client_access
on public.exam_source_catalog for all
to anon, authenticated
using (false)
with check (false);

revoke all on table public.exam_source_catalog from public, anon, authenticated;
grant select, insert, update, delete on table public.exam_source_catalog to service_role;

insert into public.exam_source_catalog (
  board,source_name,source_url,source_type,access_mode,rights_status,ingestion_status,learner_import_allowed,verified_at,notes
) values
  ('jamb','JAMB Integrated Brochure & Syllabus System (IBASS)','https://ibass.jamb.gov.ng/','official-syllabus','public','reference-only','reference-only',false,now(),'Official syllabus/brochure reference. No public official past-paper archive was established from this source.'),
  ('waec','WAEC Nigeria e-learning practice platform','http://e-learning.waecnigeria.com','official-practice-platform','public','reference-only','reference-only',false,now(),'WAEC Nigeria FAQ directs candidates here for up-to-date practice questions. Reference only until reuse rights are explicitly established.'),
  ('neco','NECO official practice examination portal','https://practice-exam.neco.gov.ng/','official-practice-platform','gated','reference-only','reference-only',false,now(),'Official NECO practice portal requires registration/login. Do not bypass access controls or bulk-import content.'),
  ('nabteb','NABTEB Chief Examiners Reports','https://nabteb.gov.ng/examinations/','official-examiner-report','public','reference-only','reference-only',false,now(),'Official reports are useful for topic/weakness analysis. Do not reproduce report questions as historical past questions without an approved rights path.')
on conflict (board,source_url) do update
set source_name=excluded.source_name,
    source_type=excluded.source_type,
    access_mode=excluded.access_mode,
    rights_status=excluded.rights_status,
    ingestion_status=excluded.ingestion_status,
    learner_import_allowed=excluded.learner_import_allowed,
    verified_at=excluded.verified_at,
    notes=excluded.notes,
    updated_at=now();
