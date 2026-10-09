-- Prevent exact question duplication for original THE GUIDE banks and v3 literature teaching.
-- Historical/source-backed board questions are deliberately excluded from this uniqueness rule.
CREATE UNIQUE INDEX IF NOT EXISTS idx_guide_original_question_unique_active_topic
ON public.questions (
  topic_id,
  regexp_replace(lower(btrim(question_text)),'[^a-z0-9]+','','g')
)
WHERE is_active=true AND topic_id IS NOT NULL
 AND source IN ('THE GUIDE Original Literature Practice','THE GUIDE Original Worked Practice');

CREATE UNIQUE INDEX IF NOT EXISTS idx_guide_v3_published_literature_title_by_course
ON public.lessons (
  course_id,
  regexp_replace(lower(btrim(title)),'[^a-z0-9]+','','g')
)
WHERE is_published=true AND teaching_version=3 AND content_quality='ready'
 AND course_id IS NOT NULL;