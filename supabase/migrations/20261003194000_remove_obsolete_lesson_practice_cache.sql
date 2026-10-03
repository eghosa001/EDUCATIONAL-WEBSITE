-- Remove obsolete generic lesson-practice seed sets.
-- v9 of lesson-practice regenerates validated source_version >= 2 sets on demand.
delete from public.lesson_practice_sets
where source_version < 2;
