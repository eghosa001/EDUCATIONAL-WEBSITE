-- Past-question PDFs are internal extraction sources, not learner content.
-- Learners receive only extracted structured questions through web-api.

drop policy if exists past_question_files_read on public.past_question_files;
drop policy if exists "Public read file metadata" on public.past_question_files;
drop policy if exists past_question_files_select_all on public.past_question_files;

create policy past_question_files_staff_read
on public.past_question_files
for select
to authenticated
using (
  has_role('super_admin'::text)
  or has_role('content_admin'::text)
  or has_role('teacher'::text)
);

update storage.buckets
set public = false
where id in ('WAEC 1','WAEC 2','WAEC 3','jamb','OTHERS');

update public.past_question_files
set public_url = null,
    file_url = null,
    updated_at = now()
where bucket_id in ('WAEC 1','WAEC 2','WAEC 3','jamb','OTHERS');
