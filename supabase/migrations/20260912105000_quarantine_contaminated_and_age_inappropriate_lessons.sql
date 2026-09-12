-- Random CJK insertions were detected across unrelated Nigerian-curriculum subjects.
-- Do not expose contaminated AI lessons until they are regenerated/reviewed.
update public.lessons
set content_quality = 'needs_review',
    is_published = false,
    updated_at = now()
where content_quality = 'ai'
  and written_content ~ '[一-龯]';

-- Primary-school AI lessons should not contain WAEC/NECO/JAMB exam-preparation claims.
-- Preserve manually verified material; quarantine only AI-generated rows for review.
update public.lessons l
set content_quality = 'needs_review',
    is_published = false,
    updated_at = now()
from public.courses c
join public.classes cl on cl.id = c.class_id
where l.course_id = c.id
  and l.content_quality = 'ai'
  and cl.code like 'P%'
  and (
    l.written_content ilike '%WAEC%'
    or l.written_content ilike '%NECO%'
    or l.written_content ilike '%JAMB%'
  );
