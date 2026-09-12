update public.lessons
set content_quality = 'needs_review',
    is_published = false,
    updated_at = now()
where is_published
  and (
    title ilike '%undefined%'
    or written_content ilike '%this is an important topic%'
    or written_content ilike '%read textbooks%'
    or written_content ilike '%builds foundational knowledge for waec%'
    or written_content ilike '%review past waec/neco/jamb%'
  );
