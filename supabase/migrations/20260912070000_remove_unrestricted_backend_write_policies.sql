-- Service-role/backend writes bypass RLS and do not need permissive public policies.
-- Remove legacy policies that accidentally exposed privileged writes to clients.
drop policy if exists audit_logs_insert_backend on public.audit_logs;
drop policy if exists documents_insert_backend on public.documents;
drop policy if exists password_resets_backend_write on public.password_resets;
drop policy if exists past_questions_insert_backend on public.past_questions;
drop policy if exists reports_insert_backend on public.reports;
drop policy if exists sessions_backend_write on public.sessions;

-- Exam configuration is readable by students but managed only by trusted admin roles.
drop policy if exists "Authenticated users can manage exam subjects" on public.exam_subjects;
drop policy if exists "Admins can manage exam subjects" on public.exam_subjects;
create policy "Admins can manage exam subjects"
on public.exam_subjects for all
to authenticated
using (has_role('admin'::text) or has_role('super_admin'::text) or has_role('content_admin'::text))
with check (has_role('admin'::text) or has_role('super_admin'::text) or has_role('content_admin'::text));
