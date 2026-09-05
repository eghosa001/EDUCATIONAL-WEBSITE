-- Add covering indexes for foreign-key columns that do not already have one.
-- This improves join/delete/update performance without changing query semantics.
DO $$
DECLARE
  fk record;
  index_name text;
  column_list text;
  index_exists boolean;
BEGIN
  FOR fk IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      con.conname AS constraint_name,
      array_agg(a.attname ORDER BY k.ordinality) AS columns
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, ordinality) ON true
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
    WHERE con.contype = 'f'
      AND n.nspname = 'public'
    GROUP BY n.nspname, c.relname, con.conname
  LOOP
    SELECT EXISTS (
      SELECT 1
      FROM pg_index i
      WHERE i.indrelid = format('%I.%I', fk.schema_name, fk.table_name)::regclass
        AND i.indisvalid
        AND i.indisready
        AND i.indkey::smallint[] @> (
          SELECT array_agg(a.attnum::smallint ORDER BY x.ord)
          FROM unnest(fk.columns) WITH ORDINALITY x(column_name, ord)
          JOIN pg_attribute a
            ON a.attrelid = format('%I.%I', fk.schema_name, fk.table_name)::regclass
           AND a.attname = x.column_name
        )
    ) INTO index_exists;

    IF NOT index_exists THEN
      column_list := (
        SELECT string_agg(format('%I', column_name), ', ' ORDER BY ord)
        FROM unnest(fk.columns) WITH ORDINALITY AS x(column_name, ord)
      );
      index_name := left('idx_fk_' || md5(fk.schema_name || '.' || fk.table_name || '.' || fk.constraint_name), 63);
      EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)', index_name, fk.schema_name, fk.table_name, column_list);
    END IF;
  END LOOP;
END $$;

-- Explicit coverage for constraints that can coexist with broader/composite
-- indexes but still benefit from their own leading-column index.
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON public.class_subjects (subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_term_id ON public.class_subjects (term_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_student_id ON public.exam_attempts (student_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question_id ON public.exam_questions (question_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON public.leaderboards (user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lessons_section_id ON public.lessons (section_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes (user_id);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON public.questions (topic_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_question_id ON public.quiz_questions (question_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_class_id ON public.school_classes (class_id);
CREATE INDEX IF NOT EXISTS idx_school_classes_term_id ON public.school_classes (term_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_course_id ON public.student_courses (course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON public.submissions (student_id);
CREATE INDEX IF NOT EXISTS idx_topics_class_id ON public.topics (class_id);
CREATE INDEX IF NOT EXISTS idx_topics_term_id ON public.topics (term_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles (role_id);
