-- Persist the final production lesson/course cleanup.
-- Archive stale quarantined orphan lessons before deletion, and remove the unused empty English draft shell.

create table if not exists public.orphan_lesson_archive_20261004
as select * from public.lessons where false;

alter table public.orphan_lesson_archive_20261004 enable row level security;
revoke all on table public.orphan_lesson_archive_20261004 from anon, authenticated;

insert into public.orphan_lesson_archive_20261004
select l.*
from public.lessons l
where l.content_quality='needs_review'
  and l.course_id is null
  and l.is_published=false
  and not exists (
    select 1 from public.orphan_lesson_archive_20261004 a where a.id=l.id
  );

delete from public.lessons l
where l.content_quality='needs_review'
  and l.course_id is null
  and l.is_published=false
  and not exists(select 1 from public.ai_conversations x where x.lesson_id=l.id)
  and not exists(select 1 from public.assignments x where x.lesson_id=l.id)
  and not exists(select 1 from public.bookmarks x where x.lesson_id=l.id)
  and not exists(select 1 from public.flashcards x where x.lesson_id=l.id)
  and not exists(select 1 from public.lesson_practice_attempts x where x.lesson_id=l.id)
  and not exists(select 1 from public.lesson_practice_sets x where x.lesson_id=l.id)
  and not exists(select 1 from public.lesson_progress x where x.lesson_id=l.id)
  and not exists(select 1 from public.lesson_quality_audits x where x.lesson_id=l.id)
  and not exists(select 1 from public.lesson_resources x where x.lesson_id=l.id)
  and not exists(select 1 from public.quizzes x where x.lesson_id=l.id)
  and not exists(select 1 from public.study_sessions x where x.lesson_id=l.id);

delete from public.course_sections
where course_id='02183441-e8e4-432d-a3d7-0e45954bade9'::uuid
  and not exists(select 1 from public.lessons where course_id='02183441-e8e4-432d-a3d7-0e45954bade9'::uuid)
  and not exists(select 1 from public.student_courses where course_id='02183441-e8e4-432d-a3d7-0e45954bade9'::uuid)
  and not exists(select 1 from public.lesson_progress where course_id='02183441-e8e4-432d-a3d7-0e45954bade9'::uuid);

delete from public.courses
where id='02183441-e8e4-432d-a3d7-0e45954bade9'::uuid
  and status='draft'
  and not exists(select 1 from public.lessons where course_id='02183441-e8e4-432d-a3d7-0e45954bade9'::uuid)
  and not exists(select 1 from public.student_courses where course_id='02183441-e8e4-432d-a3d7-0e45954bade9'::uuid)
  and not exists(select 1 from public.lesson_progress where course_id='02183441-e8e4-432d-a3d7-0e45954bade9'::uuid);
