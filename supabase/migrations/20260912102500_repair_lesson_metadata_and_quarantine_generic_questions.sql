-- Replace generated lesson metadata with the linked curriculum topic metadata where available.
update public.lessons l
set learning_objectives = t.learning_objectives,
    key_points = t.learning_objectives,
    updated_at = now()
from public.topics t
where l.topic_id = t.id
  and jsonb_typeof(t.learning_objectives) = 'array'
  and jsonb_array_length(t.learning_objectives) > 0
  and (
    l.learning_objectives::text ilike '%Define and explain key concepts of%'
    or l.key_points::text ilike '%Understand definitions and core principles%'
  );

-- Repair malformed generated titles from their authoritative linked topic name.
update public.lessons l
set title = regexp_replace(l.title, 'undefined', t.name, 'gi'),
    updated_at = now()
from public.topics t
where l.topic_id = t.id
  and l.title ~* 'undefined'
  and coalesce(trim(t.name), '') <> '';

-- Generic generated questions do not assess the lesson content. Keep them for audit/history,
-- but stop serving them to learners. Verified exam questions and content-specific questions are untouched.
update public.questions
set is_active = false,
    updated_at = now()
where source in ('NERDC_GENERATED','SYLLABUS_GENERATED')
  and coalesce(is_active, true)
  and (
    question_text ilike 'Which of the following best describes%'
    or question_text ilike 'Studying % helps students to:%'
    or question_text ilike 'Which examination%tests%knowledge%'
    or question_text ilike 'Which examination body in Nigeria tests%'
    or question_text ilike 'When solving problems on%what is the first step%'
    or question_text ilike 'In English Language,%helps students to:%'
    or question_text ilike 'Nigerian students should study%because:%'
    or question_text ilike 'Which of the following is a correct application of%'
  );

-- Malformed unresolved titles that could not be mapped must never be public.
update public.lessons
set content_quality = 'needs_review',
    is_published = false,
    updated_at = now()
where title ~* 'undefined';
