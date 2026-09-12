REVOKE SELECT ON TABLE public.questions FROM anon, authenticated;
REVOKE SELECT ON TABLE public.past_questions FROM anon, authenticated;

GRANT SELECT (
  id, subject_id, topic_id, subtopic_id, class_id, question_type,
  question_text, question_image_url, options, difficulty, marks,
  negative_marks, time_limit_seconds, source, exam_year, exam_name,
  tags, is_active, usage_count, created_by, reviewed_by, reviewed_at,
  created_at, updated_at
) ON public.questions TO anon, authenticated;

GRANT SELECT (
  id, board, year, subject_id, topic_id, question_type, question_text,
  question_image_url, options, difficulty, marks, source, tags,
  created_by, is_active, usage_count, created_at, updated_at
) ON public.past_questions TO anon, authenticated;
