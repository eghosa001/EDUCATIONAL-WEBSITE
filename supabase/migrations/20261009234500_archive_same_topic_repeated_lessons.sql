-- Archive near-duplicate legacy lessons with identical class/course/topic/title, retaining the best canonical lesson.
-- Preserve every row and all learner-linked lesson IDs. No destructive delete or progress reassignment.
-- A lesson with any linked learner progress/attempt/bookmark/session, assignment, quiz, or AI conversation is protected.
BEGIN;
CREATE TEMP TABLE guide_same_topic_lesson_duplicates ON COMMIT DROP AS
WITH ranked AS (
 SELECT l.id,l.course_id,
 row_number() over (
   partition by l.course_id,l.topic_id,regexp_replace(lower(btrim(l.title)),'[^a-z0-9]+','','g')
   order by
   ((select count(*) from public.lesson_progress p where p.lesson_id=l.id)
   +(select count(*) from public.lesson_practice_attempts p where p.lesson_id=l.id)
   +(select count(*) from public.bookmarks p where p.lesson_id=l.id)
   +(select count(*) from public.study_sessions p where p.lesson_id=l.id)
   +(select count(*) from public.ai_conversations p where p.lesson_id=l.id)
   +(select count(*) from public.assignments p where p.lesson_id=l.id)
   +(select count(*) from public.quizzes q where q.lesson_id=l.id)) desc,
   (l.content_quality='manually_verified') desc,
   length(coalesce(l.written_content,'')) desc,
   l.created_at asc nulls last,l.id
 ) rn
 FROM public.lessons l WHERE l.is_published=true AND l.topic_id IS NOT NULL
)
SELECT r.id,r.course_id FROM ranked r
WHERE r.rn>1
 AND NOT EXISTS (SELECT 1 FROM public.lesson_progress p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.lesson_practice_attempts p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.bookmarks p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.study_sessions p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.ai_conversations p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.assignments p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.quizzes q WHERE q.lesson_id=r.id);
UPDATE public.lessons l
SET is_published=false,content_quality='needs_review',updated_at=now()
FROM guide_same_topic_lesson_duplicates x WHERE x.id=l.id AND l.is_published=true;
UPDATE public.courses c SET lesson_count=(SELECT count(*) FROM public.lessons l WHERE l.course_id=c.id AND l.is_published=true),updated_at=now()
WHERE c.id IN(SELECT distinct course_id FROM guide_same_topic_lesson_duplicates);
SELECT count(*) archived_repeated_topic_lessons FROM guide_same_topic_lesson_duplicates;
COMMIT;