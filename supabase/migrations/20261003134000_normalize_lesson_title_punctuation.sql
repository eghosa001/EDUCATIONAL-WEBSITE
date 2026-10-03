-- Remove stray trailing punctuation from published lesson titles.
update public.lessons
set title = regexp_replace(trim(title), ':[[:space:]]*$', ''),
    updated_at = now()
where is_published=true
  and title ~ ':[[:space:]]*$';
