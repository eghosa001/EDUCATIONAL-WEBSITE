-- Legacy August seed lessons have no class/term/course mapping and cannot be
-- placed safely in the curriculum. Keep them for review but never serve them.
update public.lessons
set content_quality = 'needs_review',
    is_published = false,
    updated_at = now()
where course_id is null
  and is_published is distinct from false;
