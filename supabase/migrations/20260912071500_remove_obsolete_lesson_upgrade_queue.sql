-- The deployed lesson-worker selects work directly from public.lessons using
-- content_quality. The legacy queue is empty and no longer has application or
-- database routine consumers, so retain no duplicate processing state.
drop table if exists public.lesson_upgrade_queue;
