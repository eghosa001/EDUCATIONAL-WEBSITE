-- Keep denormalized lesson counts truthful.
update public.courses c
set lesson_count = x.actual_count,
    updated_at = now()
from (
  select c2.id, count(l.id)::integer as actual_count
  from public.courses c2
  left join public.lessons l on l.course_id = c2.id
  group by c2.id
) x
where c.id = x.id
  and coalesce(c.lesson_count, 0) <> x.actual_count;

-- A course with no lesson content must not be advertised as published.
update public.courses c
set status = 'draft',
    published_at = null,
    updated_at = now()
where c.status = 'published'
  and not exists (select 1 from public.lessons l where l.course_id = c.id);
