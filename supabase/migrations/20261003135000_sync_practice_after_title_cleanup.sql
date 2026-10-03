-- Keep seed lesson-practice caches synchronized after published lesson title cleanup.
-- Do not alter AI-generated or upgraded content-grounded sets.
with rebuilt as (
  select
    ps.lesson_id,
    encode(digest(
      left(trim(l.title),2000) || E'\n---\n' ||
      left(trim(l.written_content),100000) || E'\n---\n' ||
      coalesce(l.teaching_version,0)::text,
      'sha256'
    ),'hex') as fingerprint,
    jsonb_agg(
      jsonb_set(
        q.value,
        '{questionText}',
        to_jsonb(
          case q.ord
            when 1 then 'Which statement is taught in "' || left(l.title,180) || '"?'
            when 2 then 'Which idea correctly belongs to the lesson "' || left(l.title,180) || '"?'
            when 3 then 'Choose the statement that matches the lesson "' || left(l.title,180) || '".'
            when 4 then 'Which point should a learner retain from "' || left(l.title,180) || '"?'
            else 'Which statement accurately reflects "' || left(l.title,180) || '"?'
          end
        )
      )
      order by q.ord
    ) as questions
  from public.lesson_practice_sets ps
  join public.lessons l on l.id=ps.lesson_id
  cross join lateral jsonb_array_elements(ps.questions) with ordinality q(value,ord)
  where ps.generation_method='grounded-fallback'
    and ps.source_version=0
    and l.is_published=true
  group by ps.lesson_id,l.title,l.written_content,l.teaching_version
)
update public.lesson_practice_sets ps
set content_fingerprint=r.fingerprint,
    questions=r.questions,
    updated_at=now()
from rebuilt r
where ps.lesson_id=r.lesson_id;
