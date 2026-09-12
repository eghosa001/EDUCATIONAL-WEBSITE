begin;

do $$
declare
  t text;
begin
  foreach t in array array['achievements','parents','transactions','flashcard_reviews']
  loop
    execute format('drop policy if exists %I_admin_read on public.%I', t, t);
    execute format('drop policy if exists %I_select_own on public.%I', t, t);
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format(
      'create policy %I_read on public.%I for select to authenticated using (user_id = (select auth.uid()) or public.has_role(''super_admin''))',
      t, t
    );
  end loop;
end $$;

drop policy if exists flashcards_admin_read on public.flashcards;
drop policy if exists flashcards_select_own on public.flashcards;
drop policy if exists flashcards_anon_read on public.flashcards;
drop policy if exists flashcards_authenticated_read on public.flashcards;
create policy flashcards_anon_read on public.flashcards
for select to anon
using (is_public = true);
create policy flashcards_authenticated_read on public.flashcards
for select to authenticated
using (
  is_public = true
  or created_by = (select auth.uid())
  or public.has_role('super_admin')
);

drop policy if exists documents_admin_read on public.documents;
drop policy if exists past_questions_admin_read on public.past_questions;

drop policy if exists lessons_public_read on public.lessons;
drop policy if exists lessons_admin_read on public.lessons;
drop policy if exists lessons_anon_read on public.lessons;
drop policy if exists lessons_authenticated_read on public.lessons;
create policy lessons_anon_read on public.lessons
for select to anon
using (is_published = true and content_quality is distinct from 'needs_review');
create policy lessons_authenticated_read on public.lessons
for select to authenticated
using (
  (is_published = true and content_quality is distinct from 'needs_review')
  or public.has_role('super_admin')
  or public.has_role('content_admin')
);

drop policy if exists "Admins can manage exam subjects" on public.exam_subjects;
drop policy if exists "Authenticated users can read exam subjects" on public.exam_subjects;
drop policy if exists exam_subjects_read on public.exam_subjects;
drop policy if exists exam_subjects_insert_admin on public.exam_subjects;
drop policy if exists exam_subjects_update_admin on public.exam_subjects;
drop policy if exists exam_subjects_delete_admin on public.exam_subjects;
create policy exam_subjects_read on public.exam_subjects
for select to authenticated
using (true);
create policy exam_subjects_insert_admin on public.exam_subjects
for insert to authenticated
with check (public.has_role('super_admin') or public.has_role('content_admin'));
create policy exam_subjects_update_admin on public.exam_subjects
for update to authenticated
using (public.has_role('super_admin') or public.has_role('content_admin'))
with check (public.has_role('super_admin') or public.has_role('content_admin'));
create policy exam_subjects_delete_admin on public.exam_subjects
for delete to authenticated
using (public.has_role('super_admin') or public.has_role('content_admin'));

commit;
