-- Retire the legacy syllabus-generated question bank. These questions were
-- generated from subject-wide templates and can be mapped to unrelated lesson
-- topics. Published lessons now use the validated lesson-practice edge function
-- for lesson-grounded practice instead.
UPDATE public.questions
SET is_active = false,
    updated_at = now()
WHERE is_active = true
  AND source = 'SYLLABUS_GENERATED';

-- Retire synthetic "past questions" whose stems/distractors are curriculum
-- placeholders rather than real assessment items.
UPDATE public.past_questions
SET is_active = false,
    updated_at = now()
WHERE is_active = true
  AND question_text ~* '^Which of the following best relates to';

-- Seeded exams/quizzes that reference retired questions must not remain
-- publicly usable: otherwise they would bypass the question quality gate.
UPDATE public.exams
SET is_active = false,
    is_public = false,
    updated_at = now()
WHERE id IN (
  SELECT DISTINCT eq.exam_id
  FROM public.exam_questions eq
  JOIN public.questions q ON q.id = eq.question_id
  WHERE q.is_active = false
);

UPDATE public.quizzes
SET is_active = false,
    updated_at = now()
WHERE id IN (
  SELECT DISTINCT qq.quiz_id
  FROM public.quiz_questions qq
  JOIN public.questions q ON q.id = qq.question_id
  WHERE q.is_active = false
);

-- Repair the remaining published pie-chart lessons whose older curriculum
-- metadata contained only one generic objective/key point.
UPDATE public.lessons
SET learning_objectives = '["Explain how a pie chart represents parts of a whole data set","Calculate sector angles from frequencies or percentages","Interpret and construct pie charts from simple data"]'::jsonb,
    key_points = '["A complete pie chart represents 360 degrees","Sector angle = (category frequency / total frequency) × 360 degrees","All sector angles in a pie chart must add up to 360 degrees"]'::jsonb,
    updated_at = now()
WHERE is_published = true
  AND title = 'JSS3 Mathematics: Data Presentation – Pie Charts'
  AND (
    CASE WHEN jsonb_typeof(learning_objectives) = 'array' THEN jsonb_array_length(learning_objectives) ELSE 0 END < 2
    OR CASE WHEN jsonb_typeof(key_points) = 'array' THEN jsonb_array_length(key_points) ELSE 0 END < 2
  );
