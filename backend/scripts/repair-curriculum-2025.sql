-- Curriculum repair for the revised Nigerian 2025 curriculum.
-- Run against the production Supabase database after reviewing the data.
-- This script is intentionally idempotent where possible.

BEGIN;

-- 1. Add revised-curriculum subjects that were missing from the old catalog.
INSERT INTO public.subjects (name, code, description, order_index, is_core, is_active)
SELECT * FROM (VALUES
 ('Basic Science','BSC','Basic Science for Primary 1-3',60,true,true),
 ('Basic Science and Technology','BST','Basic Science and Technology for Primary 4-6',61,true,true),
 ('Physical and Health Education','PHE','Physical and Health Education',62,true,true),
 ('Nigerian History','NHI','Nigerian History',63,true,true),
 ('Social and Citizenship Studies','SCS','Social and Citizenship Studies',64,true,true),
 ('Cultural and Creative Arts','CCA','Cultural and Creative Arts',65,true,true),
 ('Digital Technologies','DIG','Digital Technologies / Basic Digital Literacy',66,true,true),
 ('Citizenship and Heritage Studies','CHS','Citizenship and Heritage Studies',67,true,true),
 ('Business Studies','BUS','Business Studies for Junior Secondary',68,true,true),
 ('Intermediate Science','ISC','Intermediate Science for Junior Secondary',69,true,true),
 ('Pre-vocational Studies','PVS','Pre-vocational Studies for Primary 4-6',70,false,true)
) v(name,code,description,order_index,is_core,is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.subjects s WHERE s.code=v.code);

-- 2. Primary 1-3 revised core offering. Government is deliberately absent.
INSERT INTO public.class_subjects (class_id, subject_id, term_id)
SELECT c.id,s.id,t.id
FROM public.classes c CROSS JOIN public.subjects s CROSS JOIN public.terms t
WHERE c.code ~ '^P[1-3]-(A|B)$'
  AND s.code IN ('ENG','MATH','BSC','PHE','NHI','SCS','CCA','CRS')
  AND NOT EXISTS (
    SELECT 1 FROM public.class_subjects x
    WHERE x.class_id=c.id AND x.subject_id=s.id AND x.term_id=t.id
  );

-- 3. Archive the known Primary 1 contamination: Biology, Chemistry, Physics and Government.
UPDATE public.courses
SET status='archived', updated_at=now()
WHERE class_id IN (SELECT id FROM public.classes WHERE code IN ('P1-A','P1-B'))
  AND subject_id IN (SELECT id FROM public.subjects WHERE code IN ('BIO','CHM','PHY','GOV'));

UPDATE public.lessons
SET is_published=false, updated_at=now()
WHERE course_id IN (
  SELECT id FROM public.courses
  WHERE class_id IN (SELECT id FROM public.classes WHERE code IN ('P1-A','P1-B'))
    AND subject_id IN (SELECT id FROM public.subjects WHERE code IN ('BIO','CHM','PHY','GOV'))
);

UPDATE public.quizzes
SET is_active=false, updated_at=now()
WHERE course_id IN (
  SELECT id FROM public.courses
  WHERE class_id IN (SELECT id FROM public.classes WHERE code IN ('P1-A','P1-B'))
    AND subject_id IN (SELECT id FROM public.subjects WHERE code IN ('BIO','CHM','PHY','GOV'))
);

-- 4. Restore class IDs on syllabus-generated questions. Their tags contain JSS1/JSS2/JSS3/SSS1/SSS2/SSS3.
UPDATE public.questions q
SET class_id=c.id, updated_at=now()
FROM public.classes c
WHERE q.source='SYLLABUS_GENERATED'
  AND q.tags @> to_jsonb(ARRAY[regexp_replace(c.code,'-.*$','')]::text[])
  AND q.class_id IS DISTINCT FROM c.id;

-- 5. Create one real course for every curriculum class/subject/term represented by topics.
INSERT INTO public.courses
(subject_id,class_id,term_id,title,slug,short_description,full_description,status,is_free)
SELECT x.subject_id,x.class_id,x.term_id,
       s.name || ' - ' || c.name || ' - ' || t.name,
       lower(regexp_replace(c.code || '-' || s.code || '-' || regexp_replace(t.name,'[^A-Za-z0-9]+','-','g'),'[^a-zA-Z0-9-]+','-','g')),
       'Curriculum-aligned ' || s.name || ' course for ' || c.name || ' (' || t.name || ').',
       'Structured lessons and practice based on the curriculum topics for ' || c.name || ', ' || s.name || ', ' || t.name || '.',
       'published',true
FROM (SELECT DISTINCT class_id,subject_id,term_id
      FROM public.topics
      WHERE class_id IS NOT NULL AND subject_id IS NOT NULL AND term_id IS NOT NULL) x
JOIN public.classes c ON c.id=x.class_id
JOIN public.subjects s ON s.id=x.subject_id
JOIN public.terms t ON t.id=x.term_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.courses co
  WHERE co.class_id=x.class_id AND co.subject_id=x.subject_id AND co.term_id=x.term_id
);

-- 6. Give each course a canonical term section.
INSERT INTO public.course_sections (course_id,title,description,order_index,is_active)
SELECT co.id,t.name || ' Lessons','Curriculum lessons for ' || co.title,1,true
FROM public.courses co JOIN public.terms t ON t.id=co.term_id
WHERE NOT EXISTS (SELECT 1 FROM public.course_sections cs WHERE cs.course_id=co.id);

-- 7. Reattach lessons to the course matching their topic's class + subject + term.
-- A lesson-specific suffix avoids collisions where the old database duplicated a topic lesson.
UPDATE public.lessons l
SET course_id=co.id,
    section_id=cs.id,
    slug=lower(regexp_replace(tp.name,'[^a-zA-Z0-9]+','-','g')) || '-' || substring(l.id::text,1,8),
    order_index=COALESCE(tp.order_index,1),
    updated_at=now()
FROM public.topics tp
JOIN public.courses co
  ON co.class_id=tp.class_id AND co.subject_id=tp.subject_id AND co.term_id=tp.term_id
JOIN LATERAL (
  SELECT id FROM public.course_sections s
  WHERE s.course_id=co.id ORDER BY order_index,id LIMIT 1
) cs ON true
WHERE l.topic_id=tp.id
  AND tp.class_id IS NOT NULL AND tp.subject_id IS NOT NULL AND tp.term_id IS NOT NULL;

-- 8. Synchronise course statistics.
UPDATE public.courses co
SET lesson_count=x.n,
    total_duration_hours=ROUND((x.minutes/60.0)::numeric,2),
    updated_at=now()
FROM (
  SELECT l.course_id,COUNT(*) n,COALESCE(SUM(l.estimated_minutes),0) minutes
  FROM public.lessons l GROUP BY l.course_id
) x
WHERE co.id=x.course_id;

COMMIT;

-- Validation checks:
-- Primary 1 must not expose Government/Biology/Chemistry/Physics as active courses.
-- Every lesson with a curriculum topic should point to a matching class/subject/term course.
-- SELECT COUNT(*) FROM public.lessons l JOIN public.topics t ON t.id=l.topic_id JOIN public.courses c ON c.id=l.course_id WHERE c.class_id IS DISTINCT FROM t.class_id OR c.subject_id IS DISTINCT FROM t.subject_id OR c.term_id IS DISTINCT FROM t.term_id;
