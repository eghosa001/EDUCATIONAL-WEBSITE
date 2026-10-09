-- Reversible, non-destructive cleanup of exact legacy duplicate teaching content.
-- Never DELETE. Preserve one canonical published lesson and one active question per course/topic.
-- Keep lessons and questions referenced by learners, assignments, exams or quizzes.
-- Scope excludes historical past question records (SOURCE_PAPER:*), which have distinct provenance.
BEGIN;
CREATE TEMP TABLE duplicate_lesson_candidates ON COMMIT DROP AS
WITH ranked AS (
 SELECT l.id,l.course_id,
   row_number() over (
     partition by l.course_id,md5(l.written_content)
     order by (
       (select count(*) from public.lesson_progress p where p.lesson_id=l.id) +
       (select count(*) from public.lesson_practice_attempts a where a.lesson_id=l.id) +
       (select count(*) from public.bookmarks b where b.lesson_id=l.id) +
       (select count(*) from public.study_sessions s where s.lesson_id=l.id) +
       (select count(*) from public.ai_conversations a where a.lesson_id=l.id) +
       (select count(*) from public.assignments a where a.lesson_id=l.id) +
       (select count(*) from public.quizzes q where q.lesson_id=l.id)
     ) desc, l.created_at asc nulls last,l.id
   ) rank
 FROM public.lessons l
 WHERE l.is_published=true AND l.course_id is not null
 AND length(coalesce(l.written_content,''))>1500
)
SELECT r.id,r.course_id FROM ranked r
WHERE rank>1
 AND NOT EXISTS (SELECT 1 FROM public.lesson_progress p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.lesson_practice_attempts p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.bookmarks p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.study_sessions p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.ai_conversations p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.assignments p WHERE p.lesson_id=r.id)
 AND NOT EXISTS (SELECT 1 FROM public.quizzes p WHERE p.lesson_id=r.id);
CREATE TEMP TABLE duplicate_question_candidates ON COMMIT DROP AS
WITH ranked AS (
 SELECT q.id,q.source,q.topic_id,
  row_number() over (
    partition by q.class_id,q.topic_id,regexp_replace(lower(btrim(q.question_text)),'[^a-z0-9]+','','g')
    order by (
      (select count(*) from public.exam_answers a where a.question_id=q.id) +
      (select count(*) from public.exam_questions a where a.question_id=q.id) +
      (select count(*) from public.quiz_questions a where a.question_id=q.id)
    ) desc,
    (q.reviewed_at is not null) desc,
    length(coalesce(q.explanation,'')) desc,
    q.created_at asc nulls last,
    q.id
  ) rank
 FROM public.questions q WHERE q.is_active=true AND q.topic_id is not null
 AND q.source IN ('THE GUIDE Lesson Checkpoint','THE GUIDE Lesson-Grounded Practice','THE GUIDE Course Review')
)
SELECT r.id FROM ranked r WHERE r.rank>1
 AND NOT EXISTS(SELECT 1 FROM public.exam_answers a WHERE a.question_id=r.id)
 AND NOT EXISTS(SELECT 1 FROM public.exam_questions a WHERE a.question_id=r.id)
 AND NOT EXISTS(SELECT 1 FROM public.quiz_questions a WHERE a.question_id=r.id);
UPDATE public.lessons l
SET is_published=false,content_quality='needs_review',updated_at=now()
FROM duplicate_lesson_candidates x WHERE l.id=x.id AND l.is_published=true;
UPDATE public.questions q SET is_active=false,updated_at=now()
FROM duplicate_question_candidates x WHERE q.id=x.id AND q.is_active=true;
UPDATE public.courses c SET lesson_count=(
 SELECT count(*) FROM public.lessons l WHERE l.course_id=c.id AND l.is_published=true
),updated_at=now()
WHERE c.id IN (SELECT distinct course_id FROM duplicate_lesson_candidates);
SELECT (SELECT count(*) FROM duplicate_lesson_candidates) exact_lessons_archived,
(SELECT count(*) FROM duplicate_question_candidates) duplicate_generic_questions_deactivated;
COMMIT;